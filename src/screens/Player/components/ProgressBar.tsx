import React, { Component } from 'react';
import TrackPlayer from 'react-native-track-player';
import styled from 'styled-components/native';
import { Text } from 'react-native';
import { padStart } from 'lodash';
import Slider from '@react-native-community/slider';

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

interface State {
    position: number;
    duration: number;
    gesture?: number;
}

export default class ProgressBar extends Component<{}, State> {
    state: State = {
        position: 0,
        duration: 0,
    }

    timer: number = 0;

    componentDidMount() {
        this.timer = setInterval(this.updateProgress, 500);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    updateProgress = async () => {
        const [position, duration] = await Promise.all([
            TrackPlayer.getPosition(),
            TrackPlayer.getDuration(),
        ]);

        this.setState({ position, duration });
    }

    handleGesture = async (gesture: number) => {
        // Set relative translation in state
        this.setState({ gesture });
    }

    handleEndOfGesture = (position: number) => {
        // Calculate and set the new position
        TrackPlayer.seekTo(position);
        this.setState({ gesture: undefined, position });
    }

    render() {
        const { position, duration, gesture } = this.state;

        return (
            <>
                <Slider
                    value={gesture || position}
                    minimumValue={0}
                    maximumValue={duration || 0}
                    onValueChange={this.handleGesture}
                    onSlidingComplete={this.handleEndOfGesture}
                    minimumTrackTintColor={'#ff8c69'}
                    disabled={!duration}
                />
                <NumberBar>
                    <Text>{getMinutes(gesture || position)}:{getSeconds(gesture || position)}</Text>
                    <Text>{getMinutes(duration)}:{getSeconds(duration)}</Text>
                </NumberBar>
            </>
        );
    }
}