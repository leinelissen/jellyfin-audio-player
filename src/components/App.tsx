import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import TrackPlayer, { Capability } from 'react-native-track-player';
import { PersistGate } from 'redux-persist/integration/react';
import Routes from '../screens';
import store, { persistedStore } from '@/store';
import {
    NavigationContainer,
    DefaultTheme,
    DarkTheme as BaseDarkTheme,
} from '@react-navigation/native';
import { ColorSchemeProvider, themes, useUserOrSystemScheme } from './Colors';
import DownloadManager from './DownloadManager';
import AppLoading from './AppLoading';

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
    const scheme = useUserOrSystemScheme();

    return (
        <NavigationContainer
            theme={scheme === 'dark' ? DarkTheme : LightTheme}
        >
            {children}
        </NavigationContainer>
    );
}

export default function App(): JSX.Element | null {
    // Track whether the player has already been setup, so that we don't
    // accidentally do it twice.
    const [hasSetupPlayer, setHasSetupPlayer] = useState(false);

    useEffect(() => {
        async function setupTrackPlayer() {
            await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });
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
            setHasSetupPlayer(true);
        }

        if (!hasSetupPlayer) {
            setupTrackPlayer();
        }
    }, [hasSetupPlayer]);

    // GUARD: Wait for setup of the player before showing the rest of the app
    if (!hasSetupPlayer) {
        return (<AppLoading />);
    }

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