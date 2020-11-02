import React, { useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { SubHeader } from 'components/Typography';
import { Text, Button } from 'react-native';
import { THEME_COLOR } from 'CONSTANTS';
import { useDispatch } from 'react-redux';
import music from 'store/music';
import { t } from '@localisation';

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
            <SubHeader>{t('setting-cache')}</SubHeader>
            <Text>{t('setting-cache-description')}</Text>
            <Button title={t('reset-cache')} onPress={handleClearCache} color={THEME_COLOR} />
        </>
    );
}