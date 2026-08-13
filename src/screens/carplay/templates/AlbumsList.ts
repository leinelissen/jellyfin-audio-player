import type { TrackWithDownload } from '@/store/tracks/hooks';
import { sql } from 'drizzle-orm';
import { ListTemplate, HybridAutoPlay, type ImageButton } from '@iternio/react-native-auto-play';
import { t } from '@/localisation';
import { groupByAlphabet } from '@/utility/groupByAlphabet';
import { playTracks } from '@/utility/usePlayTracks';
import { db } from '@/store';
import type { Album } from '@/store/albums/types';

/**
 * Creates a list template showing the 24 most recently added albums,
 * sorted by creation date in descending order.
 */
export async function createRecentAlbumsTemplate(): Promise<ListTemplate> {
    console.log('[AlbumsList] Creating Recent Albums template...');

    const albums = await db.query.albums.findMany({
        orderBy: { createdAt: 'desc' },
        limit: 24,
    });

    console.log('[AlbumsList] Recent albums count:', albums.length);

    const items = albums.map(album => ({
        type: 'default' as const,
        title: { text: album.name },
        detailedText: { text: album.albumArtist ?? t('unknown-artist') },
        onPress: async () => {
            console.log('[AlbumsList] Album selected:', album.name);
            try {
                const detailTemplate = await createAlbumDetailTemplate(album);
                await detailTemplate.push();
                console.log('[AlbumsList] Album detail pushed');
            } catch (error) {
                console.error('[AlbumsList] Error pushing album detail:', error);
            }
        },
    }));

    return new ListTemplate({
        title: { text: t('recent-albums') },
        sections: items.length > 0 ? { type: 'default', items } : undefined,
        headerActions: {
            android: {
                startHeaderAction: {
                    type: 'back',
                    onPress: () => HybridAutoPlay.popTemplate(),
                },
            },
            ios: {
                backButton: {
                    type: 'back',
                    onPress: () => HybridAutoPlay.popTemplate(),
                },
            },
        },
    });
}

/**
 * Creates a list template showing all albums grouped by alphabetical
 * sections, sorted by artist name then album name.
 */
export async function createAllAlbumsTemplate(): Promise<ListTemplate> {
    console.log('[AlbumsList] Creating All Albums template...');

    const albums = await db.query.albums.findMany({
        orderBy: (cols, { asc }) => [
            asc(sql`UPPER(COALESCE(${cols.albumArtist}, ${cols.name}))`),
            asc(sql`UPPER(${cols.name})`),
        ],
    });

    console.log('[AlbumsList] Total albums:', albums.length);

    const sections = groupByAlphabet(albums, album => album.albumArtist ?? album.name)
        .map(({ label, data: sectionAlbums }) => ({
            type: 'default' as const,
            title: label,
            items: sectionAlbums.map(album => ({
                type: 'default' as const,
                title: { text: album.name },
                detailedText: { text: album.albumArtist ?? t('unknown-artist') },
                onPress: async () => {
                    console.log('[AlbumsList] Album selected:', album.name);
                    try {
                        const detailTemplate = await createAlbumDetailTemplate(album);
                        await detailTemplate.push();
                        console.log('[AlbumsList] Album detail pushed');
                    } catch (error) {
                        console.error('[AlbumsList] Error pushing album detail:', error);
                    }
                },
            })),
        }));

    return new ListTemplate({
        title: { text: t('all-albums') },
        sections: sections.length > 0 ? sections : undefined,
        headerActions: {
            android: {
                startHeaderAction: {
                    type: 'back',
                    onPress: () => HybridAutoPlay.popTemplate(),
                },
            },
            ios: {
                backButton: {
                    type: 'back',
                    onPress: () => HybridAutoPlay.popTemplate(),
                },
            },
        },
    });
}

/**
 * Creates a detail template for a specific album showing its tracks
 * with play and shuffle actions. Fetches tracks from the local DB only —
 * the caller is expected to have synced them via Sync beforehand.
 */
export async function createAlbumDetailTemplate(album: Album): Promise<ListTemplate> {
    const result = await db.query.albums.findFirst({
        where: { id: album.id },
        with: {
            tracks: {
                orderBy: {
                    parentIndexNumber: 'asc',
                    indexNumber: 'asc',
                },
                with: { download: true },
            },
        },
    });

    const tracks: TrackWithDownload[] = result?.tracks ?? [];

    console.log('[AlbumsList] Album tracks:', tracks.length);

    const items = tracks.map((track, index) => ({
        type: 'default' as const,
        title: { text: track.name },
        detailedText: { text: track.albumArtist ?? t('unknown-artist') },
        onPress: async () => {
            try {
                await playTracks(tracks, { playIndex: index });
            } catch (error) {
                console.error('[AlbumsList] Error playing track:', error);
            }
        },
    }));

    const playAction: ImageButton<ListTemplate> = {
        type: 'image',
        image: { type: 'glyph', name: 'play_arrow', fontScale: 0.8 },
        onPress: async () => {
            console.log('[AlbumsList] Play album:', album.name);
            try {
                await playTracks(tracks);
            } catch (error) {
                console.error('[AlbumsList] Error playing album:', error);
            }
        },
    };

    const shuffleAction: ImageButton<ListTemplate> = {
        type: 'image',
        image: { type: 'glyph', name: 'shuffle', fontScale: 0.8 },
        onPress: async () => {
            console.log('[AlbumsList] Shuffle album:', album.name);
            try {
                await playTracks(tracks, { shuffle: true });
            } catch (error) {
                console.error('[AlbumsList] Error shuffling album:', error);
            }
        },
    };

    const backActions = {
        android: {
            startHeaderAction: {
                type: 'back' as const,
                onPress: () => HybridAutoPlay.popTemplate(),
            },
        },
        ios: {
            backButton: {
                type: 'back' as const,
                onPress: () => HybridAutoPlay.popTemplate(),
            },
        },
    };

    if (items.length === 0) {
        return new ListTemplate({
            title: { text: album.name },
            headerActions: backActions,
        });
    }

    return new ListTemplate({
        title: { text: album.name },
        sections: { type: 'default', items },
        headerActions: {
            android: {
                ...backActions.android,
                endHeaderActions: [playAction, shuffleAction],
            },
            ios: {
                ...backActions.ios,
                trailingNavigationBarButtons: [playAction, shuffleAction],
            },
        },
    });
}
