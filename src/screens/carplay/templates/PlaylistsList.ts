import { ListTemplate, HybridAutoPlay, type ImageButton } from '@iternio/react-native-auto-play';
import type { TrackWithDownload } from '@/store/tracks/hooks';
import { t } from '@/localisation';
import { playTracks } from '@/utility/usePlayTracks';
import { db } from '@/store';
import type { Playlist } from '@/store/playlists/types';

/**
 * Creates a list template showing all user playlists with track counts.
 */
export async function createPlaylistsTemplate(): Promise<ListTemplate> {
    console.log('[PlaylistsList] Creating Playlists template...');

    const playlists = await db.query.playlists.findMany();

    console.log('[PlaylistsList] Total playlists:', playlists.length);

    const items = playlists.map(playlist => ({
        type: 'default' as const,
        title: { text: playlist.name },
        detailedText: {
            text: playlist.childCount != null
                ? `${playlist.childCount} ${playlist.childCount !== 1 ? t('tracks') : t('track')}`
                : t('playlist'),
        },
        onPress: async () => {
            console.log('[PlaylistsList] Playlist selected:', playlist.name);
            try {
                const detailTemplate = await createPlaylistDetailTemplate(playlist);
                await detailTemplate.push();
                console.log('[PlaylistsList] Playlist detail pushed');
            } catch (error) {
                console.error('[PlaylistsList] Error pushing playlist detail:', error);
            }
        },
    }));

    return new ListTemplate({
        title: { text: t('playlists') },
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
 * Creates a detail template for a specific playlist showing its tracks
 * with play and shuffle actions. Reads tracks from the local DB only —
 * the caller is expected to have synced them via Sync beforehand.
 */
async function createPlaylistDetailTemplate(playlist: Playlist): Promise<ListTemplate> {
    const result = await db.query.playlists.findFirst({
        where: { id: playlist.id },
        with: { tracks: { with: { download: true } } },
    });

    const tracks: TrackWithDownload[] = result?.tracks ?? [];

    console.log('[PlaylistsList] Playlist tracks:', tracks.length);

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

    if (tracks.length === 0) {
        return new ListTemplate({
            title: { text: playlist.name },
            headerActions: backActions,
        });
    }

    const items = tracks.map((track, index) => ({
        type: 'default' as const,
        title: { text: track.name },
        detailedText: { text: track.albumArtist ?? t('unknown-artist') },
        onPress: async () => {
            try {
                await playTracks(tracks, { playIndex: index });
            } catch (error) {
                console.error('[PlaylistsList] Error playing track:', error);
            }
        },
    }));

    const playAction: ImageButton<ListTemplate> = {
        type: 'image',
        image: { type: 'glyph', name: 'play_arrow', fontScale: 0.8 },
        onPress: async () => {
            console.log('[PlaylistsList] Play playlist:', playlist.name);
            try {
                await playTracks(tracks);
            } catch (error) {
                console.error('[PlaylistsList] Error playing playlist:', error);
            }
        },
    };

    const shuffleAction: ImageButton<ListTemplate> = {
        type: 'image',
        image: { type: 'glyph', name: 'shuffle', fontScale: 0.8 },
        onPress: async () => {
            console.log('[PlaylistsList] Shuffle playlist:', playlist.name);
            try {
                await playTracks(tracks, { shuffle: true });
            } catch (error) {
                console.error('[PlaylistsList] Error shuffling playlist:', error);
            }
        },
    };

    return new ListTemplate({
        title: { text: playlist.name },
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
