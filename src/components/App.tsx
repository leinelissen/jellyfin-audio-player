import React, { Component } from 'react';
import { Provider } from 'react-redux';
import TrackPlayer from 'react-native-track-player';
import { PersistGate } from 'redux-persist/integration/react';
import { AppearanceProvider, Appearance, AppearanceListener } from 'react-native-appearance';
import Routes from '../screens';
import store, { persistedStore } from 'store';
import {
    NavigationContainer,
    DefaultTheme,
    DarkTheme,
} from '@react-navigation/native';
import { colors } from './Colors';

interface State {
    isReady: boolean;
    colorScheme?: string;
}

export default class App extends Component<{}, State> {
    state: State = {
        isReady: false,
    };

    subscription = null;

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
        this.subscription = Appearance.addChangeListener(this.setScheme);
        this.setState({ isReady: true, colorScheme: Appearance.getColorScheme() });
    }
    
    componentWillUnmount() {
        this.subscription?.remove();
    }

    setScheme: AppearanceListener = ({ colorScheme }) => {
        this.setState({ colorScheme });
    }
    
    render() {
        const { isReady, colorScheme } = this.state;

        if (!isReady) {
            return null;
        }

        console.log(colorScheme);

        return (
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistedStore}>
                    <AppearanceProvider>
                        <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                            <Routes />
                        </NavigationContainer>
                    </AppearanceProvider>
                </PersistGate>
            </Provider>
        );
    }
}