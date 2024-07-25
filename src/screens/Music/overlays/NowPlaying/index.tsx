import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Platform, Pressable, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled, { css } from 'styled-components/native';

import PlayIcon from '@/assets/icons/play.svg';
import PauseIcon from '@/assets/icons/pause.svg';
import useCurrentTrack from '@/utility/useCurrentTrack';
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player';
import { Shadow } from 'react-native-shadow-2';
import usePrevious from '@/utility/usePrevious';
import { Text } from '@/components/Typography';

import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { useNavigation } from '@react-navigation/native';
import { calculateProgressTranslation } from '@/components/Progresstrack';
import { NavigationProp } from '@/screens/types';
import { ShadowWrapper } from '@/components/Shadow';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const NOW_PLAYING_POPOVER_MARGIN = 6;
export const NOW_PLAYING_POPOVER_WIDTH = Dimensions.get('screen').width - 2 * NOW_PLAYING_POPOVER_MARGIN;
export const NOW_PLAYING_POPOVER_HEIGHT = 58;

const PopoverPosition = css`
    position: absolute;
    left: ${NOW_PLAYING_POPOVER_MARGIN}px;
    right: ${NOW_PLAYING_POPOVER_MARGIN}px;
    border-radius: 8px;
    overflow: visible;
`;

const Container = styled.ScrollView`
    ${PopoverPosition};
`;

const InnerContainer = styled.TouchableOpacity`
    height: ${NOW_PLAYING_POPOVER_HEIGHT}px;
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
    const { state } = usePlaybackState();
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
        case State.Buffering:
        case State.Connecting:
            return (
                <Pressable onPress={TrackPlayer.pause}>
                    <ActivityIndicator />
                </Pressable>
            );
        default:
            return null;
    }
}

function NowPlaying({ offset = 0, inset }: { offset?: number, inset?: boolean }) {
    const { index, track } = useCurrentTrack();
    const { buffered, position } = useProgress();
    const defaultStyles = useDefaultStyles();
    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const previousBuffered = usePrevious(buffered);
    const previousPosition = usePrevious(position);

    const navigation = useNavigation<NavigationProp>();

    const bufferAnimation = useRef(new Animated.Value(0));
    const progressAnimation = useRef(new Animated.Value(0));

    const openNowPlayingModal = useCallback(() => {
        navigation.navigate('Player');
    }, [navigation]);

    useEffect(() => {
        const duration = (track?.duration || 0) / 10_000_000;

        // GUARD: Don't update when the duration is 0, cause it will put the
        // bars in a weird space.
        if (duration === 0) {
            return;
        }

        // First calculate the new value for the buffer animation. Then, check
        // whether the buffered state is smaller than the previous one, in which
        // case we'll just set the value without animation
        const bufferValue = calculateProgressTranslation(buffered, duration, NOW_PLAYING_POPOVER_WIDTH);
        if (buffered < (previousBuffered || 0)) {
            bufferAnimation.current.setValue(bufferValue);
        } else {
            Animated.timing(bufferAnimation.current, {
                toValue: bufferValue,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
        
        // Then, do the same for the progress animation
        const progressValule = calculateProgressTranslation(position, duration, NOW_PLAYING_POPOVER_WIDTH);
        if (position < (previousPosition || 0)) {
            progressAnimation.current.setValue(progressValule);
        } else {
            Animated.timing(progressAnimation.current, {
                toValue: progressValule,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [buffered, track?.duration, position, index, previousBuffered, previousPosition]);

    if (!track) {
        return null;
    }

    return (
        <Container
            style={{ 
                bottom: (tabBarHeight || 0) 
                    + (inset ? insets.bottom : 0)
                    + NOW_PLAYING_POPOVER_MARGIN
                    + offset 
            }}
        >
            {/** TODO: Fix shadow overflow on Android */}
            {Platform.OS === 'ios' ? (
                <ShadowOverlay pointerEvents='none'>
                    <Shadow distance={30} style={{ alignSelf: 'stretch', flexBasis: '100%' }} startColor="#00000017">
                        <View style={{ flex: 1, borderRadius: 8 }} />
                    </Shadow>
                </ShadowOverlay>
            ) : null}
            <ColoredBlurView style={{ borderRadius: 8 }}>
                <InnerContainer onPress={openNowPlayingModal} activeOpacity={0.5} testID="open-player-modal">
                    <ShadowWrapper size="small">
                        <Cover source={{ uri: (track.artwork || '') as string }} style={defaultStyles.imageBackground} />
                    </ShadowWrapper>
                    <TrackNameContainer>
                        <Text numberOfLines={1}>{track.title}</Text>
                        {(track.artist || track.album) && (
                            <Text style={{ opacity: 0.5 }} numberOfLines={1}>
                                {track.artist}{track.album ? ` — ${track.album}` : ''}
                            </Text>
                        )}
                    </TrackNameContainer>
                    <ActionButton>
                        <SelectActionButton />
                    </ActionButton>
                    <ProgressTrack
                        style={[
                            { transform: [{ translateX: bufferAnimation.current }]},
                            defaultStyles.themeBackground,
                        ]}
                        opacity={0.15}
                        stroke={4}
                    />
                    <ProgressTrack
                        style={[
                            { transform: [{ translateX: progressAnimation.current }]},
                            defaultStyles.themeBackground,
                        ]}
                        stroke={4}
                    />
                </InnerContainer>
            </ColoredBlurView>
        </Container>
    );
}

export default NowPlaying;
