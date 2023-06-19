import React, { useCallback, useEffect, useState } from 'react';
import useQueue from '@/utility/useQueue';
import { View, StyleSheet, ListRenderItemInfo } from 'react-native';
import styled, { css } from 'styled-components/native';
import useCurrentTrack from '@/utility/useCurrentTrack';
import TouchableHandler from '@/components/TouchableHandler';
import TrackPlayer, { RepeatMode, Track } from 'react-native-track-player';
import { t } from '@/localisation';
import useDefaultStyles from '@/components/Colors';
import { Text } from '@/components/Typography';
import RepeatIcon from 'assets/icons/repeat.svg';
import RepeatSingleIcon from 'assets/icons/repeat.1.svg';
import Button from '@/components/Button';
import { THEME_COLOR } from '@/CONSTANTS';
import DownloadIcon from '@/components/DownloadIcon';
import Divider from '@/components/Divider';
import ticksToDuration from '@/utility/ticksToDuration';

const ICON_SIZE = 16;

const Container = styled.FlatList<Track>`

`;

const Header = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-bottom: 8px;
    padding-top: 52px;
`;

const IconButton = styled.TouchableOpacity`
    padding: 8px;
    border-radius: 4px;
`;

const TextHalfOpacity = styled(Text)`
    opacity: 0.5;
`;

const QueueItem = styled.View<{ active?: boolean, alreadyPlayed?: boolean, isDark?: boolean }>`
    padding: 8px 0;
    flex: 0 0 auto;
    flex-direction: row;
    align-items: center;

    ${props => props.active && css`
        font-weight: 900;
        padding: 8px 18px;
        margin: 0 -18px;
        border-radius: 8px;
    `}

    ${props => props.alreadyPlayed && css`
        opacity: 0.5;
    `}
`;

const ClearQueue = styled.View`
    padding: 20px 0;
    padding-bottom: 80px;
`;

const styles = StyleSheet.create({
    trackTitle: {
        marginBottom: 2
    }
});

interface Props {
    header?: JSX.Element;
}

export default function Queue({ header }: Props) {
    const defaultStyles = useDefaultStyles();
    const queue = useQueue();
    const [repeatMode, setRepeatMode] = useState(RepeatMode.Off);
    const { index: currentIndex } = useCurrentTrack();

    const playTrack = useCallback(async (index: number) => {
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
    }, []);

    const clearQueue = useCallback(async () => {
        await TrackPlayer.reset();
    }, []);

    const toggleQueueLoop = useCallback(() => {
        setRepeatMode((currentMode) => {
            const newMode = currentMode === RepeatMode.Queue ? RepeatMode.Off : RepeatMode.Queue;
            TrackPlayer.setRepeatMode(newMode);
            return newMode;
        });
    }, []);

    const toggleTrackLoop = useCallback(() => {
        setRepeatMode((currentMode) => {
            const newMode = currentMode === RepeatMode.Track ? RepeatMode.Off : RepeatMode.Track;
            TrackPlayer.setRepeatMode(newMode);
            return newMode;
        });
    }, []);

    // Retrieve the repeat mode and assign it to the state on component mount
    useEffect(() => {
        TrackPlayer.getRepeatMode().then(setRepeatMode);
    }, []);

    return (
        <Container
            contentContainerStyle={{ padding: 40 }}
            data={queue}
            ListHeaderComponent={
                <>
                    {header}
                    <Header>
                        <Text>{t('queue')}</Text>
                        <Divider style={{ marginHorizontal: 18 }} />
                        <IconButton
                            style={repeatMode === RepeatMode.Track ? defaultStyles.activeBackground : undefined}
                            onPress={toggleTrackLoop}
                        >
                            <RepeatSingleIcon
                                fill={repeatMode === RepeatMode.Track ? THEME_COLOR : defaultStyles.textHalfOpacity.color}
                                width={ICON_SIZE}
                                height={ICON_SIZE}
                            />
                        </IconButton>
                        <IconButton
                            style={repeatMode === RepeatMode.Queue ? defaultStyles.activeBackground : undefined}
                            onPress={toggleQueueLoop}
                        >
                            <RepeatIcon
                                fill={repeatMode === RepeatMode.Queue ? THEME_COLOR : defaultStyles.textHalfOpacity.color}
                                width={ICON_SIZE}
                                height={ICON_SIZE}
                            />
                        </IconButton>
                    </Header>
                </>
            }
            renderItem={({ item: track, index}: ListRenderItemInfo<Track>) => (
                <TouchableHandler id={index} onPress={playTrack} key={index}>
                    <QueueItem 
                        active={currentIndex === index}
                        key={index}
                        alreadyPlayed={currentIndex ? index < currentIndex : false}
                        style={[
                            defaultStyles.border,
                            currentIndex === index ? defaultStyles.activeBackground : {},
                        ]}
                    >
                        <View style={{ flex: 1, marginRight: 16 }}>
                            <Text
                                style={[currentIndex === index ? { color: THEME_COLOR, fontWeight: '500' } : styles.trackTitle, { marginBottom: 2 }]}
                                numberOfLines={1}
                            >
                                {track.title}
                            </Text>
                            {(track.artist || track.album) && (
                                <TextHalfOpacity
                                    style={currentIndex === index ? { color: THEME_COLOR, fontWeight: '400' } : undefined}
                                    numberOfLines={1}
                                >
                                    {track.artist}{track.album && ' — ' + track.album}
                                </TextHalfOpacity>
                            )}
                        </View>
                        <View style={{ marginLeft: 'auto', marginRight: 8 }}>
                            <TextHalfOpacity
                                style={currentIndex === index ? { color: THEME_COLOR, fontWeight: '400' } : undefined}
                            >
                                {ticksToDuration(track.duration || 0)}
                            </TextHalfOpacity>
                        </View>
                        <View>
                            <DownloadIcon trackId={track.backendId} fill={currentIndex === index ? THEME_COLOR + '80' : undefined} />
                        </View>
                    </QueueItem>
                </TouchableHandler>

            )}
            ListFooterComponent={(
                <ClearQueue>
                    <Button title={t('clear-queue')} onPress={clearQueue} />
                </ClearQueue>
            )}
        />
    );
}