import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import TrackPlayer, { Capability } from 'react-native-track-player';
import { PersistGate } from 'redux-persist/integration/react';
import Routes from '../screens';
import store, { persistedStore } from 'store';
import {
    NavigationContainer,
    DefaultTheme,
    DarkTheme as BaseDarkTheme,
} from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { ColorSchemeContext, themes } from './Colors';
import DownloadManager from './DownloadManager';
// import ErrorReportingAlert from 'utility/ErrorReportingAlert';

const LightTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: themes.light.view.backgroundColor,
    }
};

const DarkTheme = {
    ...BaseDarkTheme,
    colors: {
        ...BaseDarkTheme.colors,
        background: themes.light.view.backgroundColor,
    }
};

export default function App(): JSX.Element {
    const colorScheme = useColorScheme();
    // const colorScheme = 'dark';
    const theme = themes[colorScheme || 'light'];

    useEffect(() => {
        async function setupTrackPlayer() {
            await TrackPlayer.setupPlayer();
            await TrackPlayer.updateOptions({
                capabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.SkipToNext,
                    Capability.SkipToPrevious,
                    Capability.Stop,
                    Capability.SeekTo,
                ],
                stopWithApp: true
            });
        }
        setupTrackPlayer();
    }, []);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistedStore}>
                <ColorSchemeContext.Provider value={theme}>
                    <NavigationContainer
                        theme={colorScheme === 'dark' ? DarkTheme : LightTheme}
                    >
                        <Routes />
                        <DownloadManager />
                    </NavigationContainer>
                </ColorSchemeContext.Provider>
            </PersistGate>
        </Provider>
    );
}