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