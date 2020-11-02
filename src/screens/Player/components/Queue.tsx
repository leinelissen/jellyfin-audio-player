import React, { useCallback } from 'react';
import useQueue from 'utility/useQueue';
import { View, Text, StyleSheet, Button } from 'react-native';
import styled, { css } from 'styled-components/native';
import useCurrentTrack from 'utility/useCurrentTrack';
import TouchableHandler from 'components/TouchableHandler';
import TrackPlayer from 'react-native-track-player';
import { THEME_COLOR } from 'CONSTANTS';
import { colors } from 'components/Colors';
import { t } from '@localisation';

const QueueItem = styled.View<{ active?: boolean, alreadyPlayed?: boolean, isDark?: boolean }>`
    padding: 10px;
    border-bottom-width: 1px;

    ${props => props.active && css`
        font-weight: 900;
        padding: 20px 35px;
        margin: 0 -25px;
    `}

    ${props => props.alreadyPlayed && css`
        opacity: 0.5;
    `}
`;

const ClearQueue = styled.View`
    margin: 20px 0;
`;

const styles = StyleSheet.create({
    title: {
        ...colors.text,
        marginBottom: 2,
    },
    artist: {
        ...colors.text,
        opacity: 0.5,
    }
});

export default function Queue() {
    const queue = useQueue();
    const currentTrack = useCurrentTrack();
    const currentIndex = queue.findIndex(d => d.id === currentTrack?.id);
    const playTrack = useCallback(async (trackId: string) => {
        await TrackPlayer.skip(trackId);
        await TrackPlayer.play();
    }, []);
    const clearQueue = useCallback(async () => {
        await TrackPlayer.reset();
    }, []);

    return (
        <View>
            <Text style={{ marginTop: 20, marginBottom: 20 }}>{t('queue')}</Text>
            {queue.map((track, i) => (
                <TouchableHandler id={track.id} onPress={playTrack} key={i}>
                    <QueueItem 
                        active={currentTrack?.id === track.id}
                        key={i}
                        alreadyPlayed={i < currentIndex}
                        style={{
                            ...colors.border,
                            ...currentTrack?.id === track.id ? colors.activeBackground : {},
                        }}
                    >
                        <Text style={styles.title}>{track.title}</Text>
                        <Text style={styles.artist}>{track.artist}</Text>
                    </QueueItem>
                </TouchableHandler>
            ))}
            <ClearQueue>
                <Button title={t('clear-queue')} color={THEME_COLOR} onPress={clearQueue} />
            </ClearQueue>
        </View>
    );
}