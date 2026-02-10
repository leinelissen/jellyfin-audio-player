import React, { useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { t } from '@/localisation';
import Button from '@/components/Button';
import styled from 'styled-components/native';
import { Paragraph } from '@/components/Typography';
import Container from '../components/Container';
import { db } from '@/store';
import albums from '@/store/albums/entity';
import artists from '@/store/artists/entity';
import tracks from '@/store/tracks/entity';
import playlists from '@/store/playlists/entity';

const ClearCache = styled(Button)`
    margin-top: 16px;
`;

export default function CacheSettings() {
    const handleClearCache = useCallback(async () => {
        // Clear all music data from database
        await db.delete(albums);
        await db.delete(artists);
        await db.delete(tracks);
        await db.delete(playlists);

        // Also clear the TrackPlayer queue
        TrackPlayer.reset();
    }, []);

    return (
        <Container>
            <Paragraph>{t('setting-cache-description')}</Paragraph>
            <ClearCache title={t('reset-cache')} onPress={handleClearCache} />
        </Container>
    );
}