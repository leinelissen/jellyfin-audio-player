import React, { useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { useDispatch } from 'react-redux';
import music from 'store/music';
import { t } from '@localisation';
import Button from 'components/Button';
import styled from 'styled-components/native';
import Text from 'components/Text';

const ClearCache = styled(Button)`
    margin-top: 16px;
`;

const Container = styled.ScrollView`
    padding: 24px;
`;

export default function CacheSettings() {
    const dispatch = useDispatch();
    const handleClearCache = useCallback(() => {
        // Dispatch an action to reset the music subreducer state
        dispatch(music.actions.reset());

        // Also clear the TrackPlayer queue
        TrackPlayer.reset();
    }, [dispatch]);

    return (
        <Container>
            <Text>{t('setting-cache-description')}</Text>
            <ClearCache title={t('reset-cache')} onPress={handleClearCache} />
        </Container>
    );
}