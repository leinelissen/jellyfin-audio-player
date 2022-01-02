import React, { useCallback } from 'react';
import useQueue from 'utility/useQueue';
import { View, StyleSheet } from 'react-native';
import styled, { css } from 'styled-components/native';
import useCurrentTrack from 'utility/useCurrentTrack';
import TouchableHandler from 'components/TouchableHandler';
import TrackPlayer from 'react-native-track-player';
import { t } from '@localisation';
import useDefaultStyles from 'components/Colors';
import Text from 'components/Text';
import Button from 'components/Button';
import { THEME_COLOR } from 'CONSTANTS';
import DownloadIcon from 'components/DownloadIcon';

const QueueItem = styled.View<{ active?: boolean, alreadyPlayed?: boolean, isDark?: boolean }>`
    padding: 10px;
    border-bottom-width: 1px;
    flex: 0 0 auto;
    flex-direction: row;
    align-items: center;

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
    trackTitle: {
        marginBottom: 2
    }
});

export default function Queue() {
    const defaultStyles = useDefaultStyles();
    const queue = useQueue();
    const { index: currentIndex } = useCurrentTrack();
    const playTrack = useCallback(async (index: number) => {
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
    }, []);
    const clearQueue = useCallback(async () => {
        await TrackPlayer.reset();
    }, []);

    return (
        <View>
            <Text style={{ marginTop: 20, marginBottom: 20 }}>{t('queue')}</Text>
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
                        <View>
                            <Text style={currentIndex === i ? { color: THEME_COLOR, fontWeight: '700' } : styles.trackTitle}>{track.title}</Text>
                            <Text style={currentIndex === i ? { color: THEME_COLOR, fontWeight: '400' } : defaultStyles.textHalfOpacity}>{track.artist}</Text>
                        </View>
                        <View style={{ marginLeft: 'auto' }}>
                            <DownloadIcon trackId={track.backendId} />
                        </View>
                    </QueueItem>
                </TouchableHandler>
            ))}
            <ClearQueue>
                <Button title={t('clear-queue')} onPress={clearQueue} />
            </ClearQueue>
        </View>
    );
}