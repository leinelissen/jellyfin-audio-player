import React, { useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { t } from '@/localisation';
import Button from '@/components/Button';
import styled from 'styled-components/native';
import { Paragraph } from '@/components/Typography';
import Container from '../components/Container';
import { db } from '@/store/db';
import { albums } from '@/store/db/schema/albums';
import { artists } from '@/store/db/schema/artists';
import { tracks } from '@/store/db/schema/tracks';
import { playlists } from '@/store/db/schema/playlists';

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