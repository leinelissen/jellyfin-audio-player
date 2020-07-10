import React from 'react';
import useQueue from 'utility/useQueue';
import { View, Text } from 'react-native';
import styled, { css } from 'styled-components/native';
import useCurrentTrack from 'utility/useCurrentTrack';
import TouchableHandler from 'components/TouchableHandler';
import usePlayTrack from 'utility/usePlayTrack';
import { THEME_COLOR } from 'CONSTANTS';

const QueueItem = styled.View<{ active?: boolean, alreadyPlayed?: boolean }>`
    padding: 10px;
    border-bottom-width: 1px;
    border-bottom-color: #eee;

    ${props => props.active && css`
        font-weight: 900;
        background-color: ${THEME_COLOR}16;
        padding: 20px 35px;
        margin: 0 -25px;
    `}

    ${props => props.alreadyPlayed && css`
        opacity: 0.25;
    `}
`;

export default function Queue() {
    const queue = useQueue();
    const currentTrack = useCurrentTrack();
    const currentIndex = queue.findIndex(d => d.id === currentTrack?.id);
    const playTrack = usePlayTrack();

    return (
        <View>
            <Text style={{ marginTop: 20, marginBottom: 20 }}>Queue</Text>
            {queue.map((track, i) => (
                <TouchableHandler id={track.id} onPress={playTrack} key={i}>
                    <QueueItem active={currentTrack?.id === track.id} key={i} alreadyPlayed={i < currentIndex}>
                        <Text style={{marginBottom: 2}}>{track.title}</Text>
                        <Text style={{ opacity: 0.5 }}>{track.artist}</Text>
                    </QueueItem>
                </TouchableHandler>
            ))}
        </View>
    );
}