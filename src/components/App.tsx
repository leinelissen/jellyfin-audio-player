import React, { PropsWithChildren, useEffect } from 'react';
import { Provider } from 'react-redux';
import TrackPlayer, { Capability } from 'react-native-track-player';
import { PersistGate } from 'redux-persist/integration/react';
import Routes from '../screens';
import store, { persistedStore, useTypedSelector } from '@/store';
import {
    NavigationContainer,
    DefaultTheme,
    DarkTheme as BaseDarkTheme,
} from '@react-navigation/native';
import { ColorSchemeProvider, themes } from './Colors';
import DownloadManager from './DownloadManager';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import { ColorScheme } from '@/store/settings/types';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

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

const BlackTheme = {
    ...BaseDarkTheme,
    colors: {
        ...BaseDarkTheme.colors,
        background: themes.black.view.backgroundColor,
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
    let theme = LightTheme;

    switch (scheme) {
        case 'dark':
            theme = DarkTheme;
            break;
        case 'black':
            theme = BlackTheme;
            break;
    }

    return (
        <NavigationContainer theme={theme}>
            {children}
        </NavigationContainer>
    );
}

// Track whether the player has already been setup, so that we don't
// accidentally do it twice.
let hasSetupPlayer = false;

/**
 * Show proper status bar style depending on the scheme used
 * Note: Placing logic inside render causes issue in the vscode editor
 * 
 * @returns Component
 */
function StatusBarView() {
    const systemScheme = useColorScheme();
    const userScheme = useTypedSelector((state) => state.settings.colorScheme);
    const scheme = userScheme === ColorScheme.System ? systemScheme : userScheme;
    let statusBar =  <StatusBar barStyle="dark-content" backgroundColor={'#ffffff'} />;
    let navigationBarColor = '#ffffff';

    switch (scheme) {
        case 'dark':
            statusBar = <StatusBar barStyle="light-content" backgroundColor={'#111111'} />;
            navigationBarColor = '#333232';
            break;
        case 'black':
            statusBar = <StatusBar barStyle="light-content" backgroundColor={'#000000'} />;
            navigationBarColor = '#000000';
            break;
    }

    if (Platform.OS == 'android') {
        changeNavigationBarColor(navigationBarColor);
    }

    return statusBar;
}

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
                        <StatusBarView />
                        <Routes />
                        <DownloadManager />
                    </ThemedNavigationContainer>
                </ColorSchemeProvider>
            </PersistGate>
        </Provider>
    );
}