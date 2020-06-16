import React, { Component } from 'react';
import TrackPlayer from 'react-native-track-player';
import { NavigationContainer } from '@react-navigation/native';
import Routes from '../screens';

interface State {
    isReady: boolean;
}

export default class App extends Component<State> {
    state = {
        isReady: false
    };

    async componentDidMount() {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
            capabilities: [
                TrackPlayer.CAPABILITY_PLAY,
                TrackPlayer.CAPABILITY_PAUSE,
                TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
                TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
                TrackPlayer.CAPABILITY_STOP,
            ]
        });
        this.setState({ isReady: true });
    }
    
    render() {
        const { isReady } = this.state;

        if (!isReady) {
            return null;
        }

        return (
            <NavigationContainer>
                <Routes />
            </NavigationContainer>
        );
    }
}