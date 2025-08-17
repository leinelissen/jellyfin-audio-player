import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { t } from '@/localisation';
import useDefaultStyles, { ColoredBlurView, useUserOrSystemScheme } from '@/components/Colors';
import { StackParams } from '@/screens/types';
import NowPlaying from './overlays/NowPlaying';

import RecentAlbums from './stacks/RecentAlbums';
import Albums from './stacks/Albums';
import Album from './stacks/Album';
import Playlists from './stacks/Playlists';
import Playlist from './stacks/Playlist';
import Artists from './stacks/Artists';
import Artist from './stacks/Artist';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createStackNavigator<StackParams>();

function MusicStack() {
    const defaultStyles = useDefaultStyles();
    const scheme = useUserOrSystemScheme();

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar backgroundColor="transparent" barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
                <Stack.Navigator initialRouteName="RecentAlbums" screenOptions={{
                    headerTintColor: defaultStyles.themeColor.color,
                    headerTitleStyle: defaultStyles.stackHeader,
                    cardStyle: defaultStyles.view,
                    headerTransparent: true,
                    headerBackground: () => <ColoredBlurView style={StyleSheet.absoluteFill} />,
                }}>
                    <Stack.Screen name="RecentAlbums" component={RecentAlbums} options={{ headerTitle: t('recent-albums'), headerShown: false }} />
                    <Stack.Screen name="Albums" component={Albums} options={{ headerTitle: t('albums') }} />
                    <Stack.Screen name="Album" component={Album} options={{ headerTitle: t('album') }} />
                    <Stack.Screen name="Artists" component={Artists} options={{ headerTitle: t('artists') }} />
                    <Stack.Screen name="Artist" component={Artist} options={({ route }) => ({ headerTitle: route.params.name })} />
                    <Stack.Screen name="Playlists" component={Playlists} options={{ headerTitle: t('playlists') }} />
                    <Stack.Screen name="Playlist" component={Playlist} options={{ headerTitle: t('playlist') }} />
                </Stack.Navigator>
                <NowPlaying />
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}

export default MusicStack;
