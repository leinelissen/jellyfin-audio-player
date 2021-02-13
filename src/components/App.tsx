import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import TrackPlayer from 'react-native-track-player';
import { PersistGate } from 'redux-persist/integration/react';
import Routes from '../screens';
import store, { persistedStore } from 'store';
import {
    NavigationContainer,
    DefaultTheme,
    DarkTheme,
} from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { ColorSchemeContext, themes } from './Colors';
import ErrorReportingAlert from 'utility/ErrorReportingAlert';

export default function App(): JSX.Element {
    const colorScheme = useColorScheme();
    // const colorScheme = 'dark';
    const theme = themes[colorScheme || 'light'];

    useEffect(() => {
        async function setupTrackPlayer() {
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
        }
        setupTrackPlayer();
    }, []);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistedStore}>
                <ColorSchemeContext.Provider value={theme}>
                    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <Routes />
                    </NavigationContainer>
                </ColorSchemeContext.Provider>
            </PersistGate>
        </Provider>
    );
}