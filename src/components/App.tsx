import React, { Component } from 'react';
import { Provider } from 'react-redux';
import TrackPlayer from 'react-native-track-player';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import Routes from '../screens';
import store, { persistedStore } from '../store';

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
                TrackPlayer.CAPABILITY_SEEK_TO,
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
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistedStore}>    
                    <NavigationContainer>
                        <Routes />
                    </NavigationContainer>
                </PersistGate>
            </Provider>
        );
    }
}