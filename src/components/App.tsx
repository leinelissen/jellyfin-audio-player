import React, { PropsWithChildren, useEffect } from 'react';
import { Provider } from 'react-redux';
import TrackPlayer, { Capability } from 'react-native-track-player';
import { PersistGate } from 'redux-persist/integration/react';
import Routes from '../screens';
import store, { persistedStore, useTypedSelector } from 'store';
import {
    NavigationContainer,
    DefaultTheme,
    DarkTheme as BaseDarkTheme,
} from '@react-navigation/native';
import { ColorSchemeProvider, themes } from './Colors';
import DownloadManager from './DownloadManager';
import { useColorScheme } from 'react-native';
import { ColorScheme } from 'store/settings/types';

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
        background: themes.dark.view.backgroundColor,
    }
};

/**
 * This is a convenience wrapper for NavigationContainer that ensures that the
 * right theme is selected based on OS color scheme settings along with user preferences.
 */
function ThemedNavigationContainer({ children }: PropsWithChildren<{}>) {
    const systemScheme = useColorScheme();
    const userScheme = useTypedSelector((state) => state.settings.colorScheme);
    const scheme = userScheme === ColorScheme.System ? systemScheme : userScheme;

    return (
        <NavigationContainer
            theme={scheme === 'dark' ? DarkTheme : LightTheme}
        >
            {children}
        </NavigationContainer>
    );
}

// Track whether the player has already been setup, so that we don't
// accidentally do it twice.
let hasSetupPlayer = false;

export default function App(): JSX.Element {
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
                progressUpdateEventInterval: 5,
            });
        }

        if (!hasSetupPlayer) {
            setupTrackPlayer();
            hasSetupPlayer = true;
        }
    }, []);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistedStore}>
                <ColorSchemeProvider>
                    <ThemedNavigationContainer>
                        <Routes />
                        <DownloadManager />
                    </ThemedNavigationContainer>
                </ColorSchemeProvider>
            </PersistGate>
        </Provider>
    );
}