import React, { Component } from 'react';
import TrackPlayer, { State as PlayerState } from 'react-native-track-player';
import styled from 'styled-components/native';
import { Text, Dimensions } from 'react-native';
import { padStart, debounce } from 'lodash';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const Screen = Dimensions.get('screen');

const Container = styled.View`
    width: 100%;
    margin-top: 10px;
    background-color: #eeeeee;
    position: relative;
`;

interface ProgressProp {
    progress: number;
}

const Bar = styled.View<ProgressProp>`
    background-color: salmon;
    height: 4px;
    border-radius: 2px;
    width: ${(props: ProgressProp) => props.progress * 100}%;
`;

const PositionIndicator = styled.View<ProgressProp>`
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

interface State {
    position: number;
    duration: number;
    gesture?: {
        previousState?: PlayerState;
        translation?: number;
    }
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

    handleGesture = async (event: PanGestureHandlerGestureEvent) => {
        // Check if the gesture has started, and if it has not, prepare the player
        if (!this.state.gesture) {
            // Pause the player and store the previous state
            TrackPlayer.getState()
                .then((previousState) => this.setState({ gesture: { previousState }}))
                .then(() => TrackPlayer.pause());
            
        }

        // Set relative translation in state
        this.setState({ 
            gesture: { 
                previousState: this.state.gesture?.previousState,
                translation: event.nativeEvent?.absoluteX,
            },
        });

        // Trigger the end of gesture function
        this.handleEndOfGesture();
    }

    handleEndOfGesture = debounce(() => {
        // Calculate and set the new position
        const { gesture, duration } = this.state;
        const progress = Math.min(Math.max((gesture?.translation || 0) / Screen.width, 0), 1);
        const position = Math.floor(duration * progress);
        TrackPlayer.seekTo(position);

        // Restart the player
        if (this.state.gesture?.previousState === TrackPlayer.STATE_PLAYING) {
            TrackPlayer.play();
        }

        this.setState({ gesture: undefined, position });
    }, 500);

    render() {
        const { position, duration, gesture } = this.state;
        const progress = gesture
            ? Math.min(Math.max((gesture?.translation || 0) / Screen.width, 0), 1)
            : position / duration;
            
        return (
            <>
                <PanGestureHandler onGestureEvent={this.handleGesture}>
                    <Container>
                        <Bar progress={progress} />
                        <PositionIndicator progress={progress} />
                    </Container>
                </PanGestureHandler>
                <NumberBar>
                    <Text>0:00</Text>
                    {gesture
                        ? <Text>{getMinutes(duration * progress)}:{getSeconds(duration * progress)}</Text>
                        : <Text>{getMinutes(position)}:{getSeconds(position)}</Text>
                    }
                    <Text>{getMinutes(duration)}:{getSeconds(duration)}</Text>
                </NumberBar>
            </>
        );
    }
}