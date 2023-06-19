import React from 'react';
import { StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { THEME_COLOR } from '@/CONSTANTS';
import { t } from '@/localisation';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { StackParams } from '@/screens/types';
import NowPlaying from './overlays/NowPlaying';

import RecentAlbums from './stacks/RecentAlbums';
import Albums from './stacks/Albums';
import Album from './stacks/Album';
import Playlists from './stacks/Playlists';
import Playlist from './stacks/Playlist';
import Artists from './stacks/Artists';
import Artist from './stacks/Artist';

const Stack = createStackNavigator<StackParams>();

function MusicStack() {
    const defaultStyles = useDefaultStyles();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack.Navigator initialRouteName="RecentAlbums" screenOptions={{
                headerTintColor: THEME_COLOR,
                headerTitleStyle: defaultStyles.stackHeader,
                cardStyle: defaultStyles.view,
                headerTransparent: true,
                headerBackground: () => <ColoredBlurView style={StyleSheet.absoluteFill} />,
            }}>
                <Stack.Screen name="RecentAlbums" component={RecentAlbums} options={{ headerTitle: t('recent-albums'), headerShown: false }} />
                <Stack.Screen name="Albums" component={Albums} options={{ headerTitle: t('albums') }} />
                <Stack.Screen name="Album" component={Album} options={{ headerTitle: t('album') }} />
                <Stack.Screen name="Artists" component={Artists} options={{ headerTitle: t('artists') }} />
                <Stack.Screen name="Artist" component={Artist} options={({ route }) => ({ headerTitle: route.params.Name })} />
                <Stack.Screen name="Playlists" component={Playlists} options={{ headerTitle: t('playlists') }} />
                <Stack.Screen name="Playlist" component={Playlist} options={{ headerTitle: t('playlist') }} />
            </Stack.Navigator>
            <NowPlaying />
        </GestureHandlerRootView>
    );
}

export default MusicStack;