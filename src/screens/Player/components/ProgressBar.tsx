import React from 'react';
import { useTrackPlayerProgress } from 'react-native-track-player';
import styled from 'styled-components/native';
import { View, Text } from 'react-native';
import { padStart } from 'lodash';

const Container = styled.View`
    width: 100%;
    margin-top: 10px;
    background-color: #eeeeee;
    position: relative;
`;

const Bar = styled.View<{ progress: number }>`
    background-color: salmon;
    height: 4px;
    border-radius: 2px;
    width: ${props => props.progress * 100}%;
`;

const PositionIndicator = styled.View<{ progress: number }>`
    width: 20px;
    height: 20px;
    border-radius: 100px;
    border: 1px solid #eee;
    background-color: white;
    transform: translateX(-10px) translateY(-8.5px);
    position: absolute;
    top: 0;
    left: ${props => props.progress * 100}%;
    box-shadow: 0px 4px 8px rgba(0,0,0,0.1);
`;

const NumberBar = styled.View`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding: 20px 0;
`;

function getSeconds(seconds: number): string {
    return padStart(String(Math.floor(seconds % 60).toString()), 2, '0');
}

function getMinutes(seconds: number): number {
    return Math.floor(seconds / 60);
}

export default function ProgressBar() {
    const { position, duration } = useTrackPlayerProgress(500);

    return (
        <>
            <Container>
                <Bar progress={position / duration} />
                <PositionIndicator progress={position / duration} />
            </Container>
            <NumberBar>
                <Text>0:00</Text>
                <Text>{getMinutes(position)}:{getSeconds(position)}</Text>
                <Text>{getMinutes(duration)}:{getSeconds(duration)}</Text>
            </NumberBar>
        </>
    );
}