import React, { useCallback, useEffect, useState } from 'react';
import useQueue from 'utility/useQueue';
import { View, StyleSheet } from 'react-native';
import styled, { css } from 'styled-components/native';
import useCurrentTrack from 'utility/useCurrentTrack';
import TouchableHandler from 'components/TouchableHandler';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';
import { t } from '@localisation';
import useDefaultStyles from 'components/Colors';
import { Text } from 'components/Typography';
import RepeatIcon from 'assets/icons/repeat.svg';
import Button from 'components/Button';
import { THEME_COLOR } from 'CONSTANTS';
import DownloadIcon from 'components/DownloadIcon';
import Divider from 'components/Divider';
import ticksToDuration from 'utility/ticksToDuration';

const ICON_SIZE = 16;

const Container = styled.View`
    margin-top: 56px;
`;

const Header = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 8px;
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
    margin: 20px 0;
`;

const styles = StyleSheet.create({
    trackTitle: {
        marginBottom: 2
    }
});

export default function Queue() {
    const defaultStyles = useDefaultStyles();
    const queue = useQueue();
    const [isRepeating, setIsRepeating] = useState(false);
    const { index: currentIndex } = useCurrentTrack();

    const playTrack = useCallback(async (index: number) => {
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
    }, []);

    const clearQueue = useCallback(async () => {
        await TrackPlayer.reset();
    }, []);

    const toggleLoop = useCallback(() => {
        setIsRepeating((prev) => {
            TrackPlayer.setRepeatMode(prev ? RepeatMode.Off : RepeatMode.Queue);
            return !prev;
        });
    }, []);

    // Retrieve the repeat mode and assign it to the state on component mount
    useEffect(() => {
        TrackPlayer.getRepeatMode()
            .then((mode) => {
                setIsRepeating(mode === RepeatMode.Queue);
            });
    }, []);

    return (
        <Container>
            <Header>
                <Text>{t('queue')}</Text>
                <Divider style={{ marginHorizontal: 18 }} />
                <IconButton
                    style={isRepeating ? defaultStyles.activeBackground : undefined}
                    onPress={toggleLoop}
                >
                    <RepeatIcon
                        fill={isRepeating ? THEME_COLOR : defaultStyles.textHalfOpacity.color}
                        width={ICON_SIZE}
                        height={ICON_SIZE}
                    />
                </IconButton>
            </Header>
            {queue.map((track, i) => (
                <TouchableHandler id={i} onPress={playTrack} key={i}>
                    <QueueItem 
                        active={currentIndex === i}
                        key={i}
                        alreadyPlayed={currentIndex ? i < currentIndex : false}
                        style={[
                            defaultStyles.border,
                            currentIndex === i ? defaultStyles.activeBackground : {},
                        ]}
                    >
                        <View style={{ flex: 1, marginRight: 16 }}>
                            <Text
                                style={[currentIndex === i ? { color: THEME_COLOR, fontWeight: '500' } : styles.trackTitle, { marginBottom: 2 }]}
                                numberOfLines={1}
                            >
                                {track.title}
                            </Text>
                            <TextHalfOpacity
                                style={currentIndex === i ? { color: THEME_COLOR, fontWeight: '400' } : undefined}
                                numberOfLines={1}
                            >
                                {track.artist}{track.album && ' — ' + track.album}
                            </TextHalfOpacity>
                        </View>
                        <View style={{ marginLeft: 'auto', marginRight: 8 }}>
                            <TextHalfOpacity
                                style={currentIndex === i ? { color: THEME_COLOR, fontWeight: '400' } : undefined}
                            >
                                {ticksToDuration(track.duration || 0)}
                            </TextHalfOpacity>
                        </View>
                        <View>
                            <DownloadIcon trackId={track.backendId} fill={currentIndex === i ? THEME_COLOR + '80' : undefined} />
                        </View>
                    </QueueItem>
                </TouchableHandler>
            ))}
            <ClearQueue>
                <Button title={t('clear-queue')} onPress={clearQueue} />
            </ClearQueue>
        </Container>
    );
}