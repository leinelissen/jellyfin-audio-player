import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MusicStackParams } from './types';
import Albums from './stacks/Albums';
import Album from './stacks/Album';
import RecentAlbums from './stacks/RecentAlbums';
import { THEME_COLOR } from 'CONSTANTS';
import { t } from '@localisation';
import useDefaultStyles from 'components/Colors';
import Playlists from './stacks/Playlists';
import Playlist from './stacks/Playlist';
import NowPlaying from './overlays/NowPlaying';

const Stack = createStackNavigator<MusicStackParams>();

function MusicStack() {
    const defaultStyles = useDefaultStyles();

    return (
        <>
            <Stack.Navigator initialRouteName="RecentAlbums" screenOptions={{
                headerTintColor: THEME_COLOR,
                headerTitleStyle: defaultStyles.stackHeader,
                cardStyle: defaultStyles.view,
            }}>
                <Stack.Screen name="RecentAlbums" component={RecentAlbums} options={{ headerTitle: t('recent-albums') }} />
                <Stack.Screen name="Albums" component={Albums} options={{ headerTitle: t('albums') }} />
                <Stack.Screen name="Album" component={Album} options={{ headerTitle: t('album') }} />
                <Stack.Screen name="Playlists" component={Playlists} options={{ headerTitle: t('playlists') }} />
                <Stack.Screen name="Playlist" component={Playlist} options={{ headerTitle: t('playlist') }} />
            </Stack.Navigator>
            <NowPlaying />
        </>
    );
}

export default MusicStack;