import React, { PropsWithChildren, useEffect, useState } from 'react';
import TrackPlayer, { Capability } from 'react-native-track-player';
import Routes from '../screens';
import {
    NavigationContainer,
    DefaultTheme,
    DarkTheme as BaseDarkTheme,
} from '@react-navigation/native';
import { ColorSchemeProvider, themes, useScheme } from './Colors';

import AppLoading from './AppLoading';
import { captureException } from '@sentry/react-native';
import AppDatabaseProvider from './AppDatabaseProvider';

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
    const scheme = useScheme();

    return (
        <NavigationContainer
            theme={scheme === 'dark' ? DarkTheme : LightTheme}
        >
            {children}
        </NavigationContainer>
    );
}

export default function App(): React.JSX.Element | null {
    // Track whether the player has already been setup, so that we don't
    // accidentally do it twice.
    const [hasSetupPlayer, setHasSetupPlayer] = useState(false);

    useEffect(() => {
        async function setupTrackPlayer() {
            await TrackPlayer.setupPlayer({
                autoHandleInterruptions: true,
            });
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
            setupTrackPlayer()
                .catch((e: unknown) => {
                    console.error(e);
                    captureException(e);
                    setHasSetupPlayer(true);
                });
        }
    }, [hasSetupPlayer]);

    // GUARD: Wait for setup of the player before showing the rest of the app
    if (!hasSetupPlayer) {
        return (<AppLoading />);
    }

    return (
        <AppDatabaseProvider>
            <ColorSchemeProvider>
                <ThemedNavigationContainer>
                    <Routes />
                </ThemedNavigationContainer>
            </ColorSchemeProvider>
        </AppDatabaseProvider>
    );
}
