import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Pressable, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled, { css } from 'styled-components/native';

import PlayIcon from 'assets/icons/play.svg';
import PauseIcon from 'assets/icons/pause.svg';
import useCurrentTrack from 'utility/useCurrentTrack';
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player';
import { Shadow } from 'react-native-shadow-2';
import usePrevious from 'utility/usePrevious';
import { Text } from 'components/Typography';

import useDefaultStyles, { ColoredBlurView } from 'components/Colors';
import { useNavigation } from '@react-navigation/native';
import { calculateProgressTranslation } from 'components/Progresstrack';
import { THEME_COLOR } from 'CONSTANTS';
import { MusicNavigationProp } from 'screens/Music/types';
import { ShadowWrapper } from 'components/Shadow';

const NOW_PLAYING_POPOVER_MARGIN = 6;
const NOW_PLAYING_POPOVER_WIDTH = Dimensions.get('screen').width - 2 * NOW_PLAYING_POPOVER_MARGIN;

const PopoverPosition = css`
    position: absolute;
    bottom: ${NOW_PLAYING_POPOVER_MARGIN}px;
    left: ${NOW_PLAYING_POPOVER_MARGIN}px;
    right: ${NOW_PLAYING_POPOVER_MARGIN}px;
    border-radius: 8px;
    overflow: visible;
`;

const Container = styled.ScrollView`
    ${PopoverPosition};
`;

const InnerContainer = styled.TouchableOpacity`
    padding: 12px;
    overflow: hidden;
    flex: 1;
    flex-direction: row;
    align-items: center;
`;

const ProgressTrack = styled(Animated.View)<{ stroke?: number; opacity?: number}>`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: ${(props) => props.stroke ? props.stroke + 'px' : '100%'};
    background-color: ${THEME_COLOR};
    opacity: ${(props) => props.opacity || 1};
    border-radius: 99px;
`;

const ShadowOverlay = styled.View`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
`;

const Cover = styled(FastImage)`
    height: 32px;
    width: 32px;
    border-radius: 4px;
    margin-right: 12px;
`;

const TrackNameContainer = styled.View`
    flex: 1;
    margin-right: 12px;
`;

const ActionButton = styled.Pressable`
    margin-right: 8px;
`;

function SelectActionButton() {
    const state = usePlaybackState();
    const defaultStyles = useDefaultStyles();

    switch(state) {
        case State.Playing:
            return (
                <Pressable onPress={TrackPlayer.pause}>
                    <PauseIcon fill={defaultStyles.text.color} height={18} width={18} />
                </Pressable>
            );
        case State.Stopped:
        case State.Paused:
            return (
                <Pressable onPress={TrackPlayer.play}>
                    <PlayIcon fill={defaultStyles.text.color} height={18} width={18} />
                </Pressable>
            );
        // @ts-expect-error For some reason buffering isn't stated right in the types
        case 'buffering':
        case State.Buffering:
        case State.Connecting:
            return (
                <Pressable onPress={TrackPlayer.stop}>
                    <ActivityIndicator />
                </Pressable>
            );
        default:
            return null;
    }
}

function NowPlaying() {
    const { index, track } = useCurrentTrack();
    const { buffered, duration, position } = useProgress();
    const defaultStyles = useDefaultStyles();
    const previousIndex = usePrevious(index);
    const navigation = useNavigation<MusicNavigationProp>();

    const bufferAnimation = useRef(new Animated.Value(0));
    const progressAnimation = useRef(new Animated.Value(0));

    const openNowPlayingModal = useCallback(() => {
        navigation.navigate('Player');
    }, [navigation]);

    useEffect(() => {
        const hasChangedTrack = previousIndex !== index || duration === 0;

        Animated.timing(bufferAnimation.current, {
            toValue: calculateProgressTranslation(buffered, duration, NOW_PLAYING_POPOVER_WIDTH),
            duration: hasChangedTrack ? 0 : 500,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start();
        Animated.timing(progressAnimation.current, {
            toValue: calculateProgressTranslation(position, duration, NOW_PLAYING_POPOVER_WIDTH),
            duration: hasChangedTrack ? 0 : 500,
            useNativeDriver: true,
        }).start();
    }, [buffered, duration, position, index, previousIndex]);

    if (!track) {
        return null;
    }

    return (
        <Container>
            <ShadowOverlay pointerEvents='none'>
                <Shadow distance={30} viewStyle={{ alignSelf: 'stretch', flexBasis: '100%' }} startColor="#00000017">
                    <View style={{ flex: 1, borderRadius: 8 }} />
                </Shadow>
            </ShadowOverlay>
            <ColoredBlurView style={{ borderRadius: 8 }}>
                <InnerContainer onPress={openNowPlayingModal} activeOpacity={0.5}>
                    <ShadowWrapper size="small">
                        <Cover source={{ uri: (track.artwork || '') as string }} style={defaultStyles.imageBackground} />
                    </ShadowWrapper>
                    <TrackNameContainer>
                        <Text numberOfLines={1}>{track.title}</Text>
                        <Text style={{ opacity: 0.5 }} numberOfLines={1}>
                            {track.artist}{track.album ? ` — ${track.album}` : ''}
                        </Text>
                    </TrackNameContainer>
                    <ActionButton>
                        <SelectActionButton />
                    </ActionButton>
                    <ProgressTrack
                        style={{ transform: [{ translateX: bufferAnimation.current }]}}
                        opacity={0.15}
                        stroke={4}
                    />
                    <ProgressTrack
                        style={{ transform: [{ translateX: progressAnimation.current }]}}
                        stroke={4}
                    />
                </InnerContainer>
            </ColoredBlurView>
        </Container>
    );
}

export default NowPlaying;
