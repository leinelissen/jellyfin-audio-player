import React, { useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { SubHeader } from 'components/Typography';
import { Text, Button } from 'react-native';
import { THEME_COLOR } from 'CONSTANTS';
import { useDispatch } from 'react-redux';
import music from 'store/music';

export default function CacheSettings() {
    const dispatch = useDispatch();
    const handleClearCache = useCallback(() => {
        // Dispatch an action to reset the music subreducer state
        dispatch(music.actions.reset());

        // Also clear the TrackPlayer queue
        TrackPlayer.reset();
    }, [dispatch]);

    return (
        <>
            <SubHeader>Cache</SubHeader>
            <Text>If you have updated your Jellyfin library, but the app is holding on to cached assets, you can forcefully clear the cache using this button. This will force the app to fetch the library from scratch.</Text>
            <Button title="Reset Cache" onPress={handleClearCache} color={THEME_COLOR} />
        </>
    );
}