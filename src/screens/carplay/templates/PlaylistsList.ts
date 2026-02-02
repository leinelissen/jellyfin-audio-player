import { ListTemplate, HybridAutoPlay } from '@iternio/react-native-auto-play';
import type { Playlist } from '@/store/music/types';
import { t } from '@/localisation';
import { fetchTracksByPlaylist } from '@/store/music/actions';
import { playTracks } from '@/utility/usePlayTracks';
import store from '@/store';

/**
 * Creates a list template showing all user playlists with track counts.
 */
export function createPlaylistsTemplate(): ListTemplate {
    console.log('[PlaylistsList] Creating Playlists template...');
    
    const state = store.getState();
    const playlists = state.music.playlists.ids
        .map(id => state.music.playlists.entities[id])
        .filter((playlist): playlist is Playlist => playlist !== undefined);

    console.log('[PlaylistsList] Total playlists:', playlists.length);

    const items = playlists.map(playlist => {
        const trackCount = playlist.ChildCount ||
                                            state.music.tracks.byPlaylist[playlist.Id]?.length ||
                                            playlist.Tracks?.length ||
                                            0;

        return {
            type: 'default' as const,
            title: { text: playlist.Name },
            detailedText: { text: `${trackCount} ${trackCount !== 1 ? t('tracks') : t('track')}` },
            onPress: async () => {
                console.log('[PlaylistsList] Playlist selected:', playlist.Name);
                try {
                    const detailTemplate = await createPlaylistDetailTemplate(playlist);
                    await detailTemplate.push();
                    console.log('[PlaylistsList] Playlist detail pushed');
                } catch (error) {
                    console.error('[PlaylistsList] Error pushing playlist detail:', error);
                }
            },
        };
    });

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
 * with play and shuffle actions. Fetches tracks from the API if they're
 * not already in the store.
 */
async function createPlaylistDetailTemplate(playlist: Playlist): Promise<ListTemplate> {
    let state = store.getState();
    let trackIds = state.music.tracks.byPlaylist[playlist.Id] || [];
    
    // Only fetch if tracks are missing
    if (trackIds.length === 0) {
        console.log('[PlaylistsList] Tracks missing, fetching for playlist:', playlist.Name);
        await store.dispatch(fetchTracksByPlaylist(playlist.Id));
        state = store.getState();
        trackIds = state.music.tracks.byPlaylist[playlist.Id] || [];
    }
    
    const tracks = trackIds
        .map(id => state.music.tracks.entities[id])
        .filter((track): track is NonNullable<typeof track> => track !== undefined);
    
    console.log('[PlaylistsList] Playlist tracks:', tracks.length);

    const items = tracks.map((track, index) => ({
        type: 'default' as const,
        title: { text: track.Name },
        detailedText: { text: track.Artists?.join(', ') || t('unknown-artist') },
        onPress: async () => {
            try {
                await playTracks(
                    trackIds,
                    state.music.tracks.entities,
                    state.downloads.entities,
                    { playIndex: index }
                );
            } catch (error) {
                console.error('[PlaylistsList] Error playing track:', error);
            }
        },
    }));

    const playAction = {
        type: 'text' as const,
        title: t('play'),
        onPress: async () => {
            console.log('[PlaylistsList] Play playlist:', playlist.Name);
            try {
                await playTracks(
                    trackIds,
                    state.music.tracks.entities,
                    state.downloads.entities
                );
            } catch (error) {
                console.error('[PlaylistsList] Error playing playlist:', error);
            }
        },
    };

    const shuffleAction = {
        type: 'text' as const,
        title: t('shuffle'),
        onPress: async () => {
            console.log('[PlaylistsList] Shuffle playlist:', playlist.Name);
            try {
                await playTracks(
                    trackIds,
                    state.music.tracks.entities,
                    state.downloads.entities,
                    { shuffle: true }
                );
            } catch (error) {
                console.error('[PlaylistsList] Error shuffling playlist:', error);
            }
        },
    };

    if (items.length === 0) {
        return new ListTemplate({
            title: { text: playlist.Name },
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

    return new ListTemplate({
        title: { text: playlist.Name },
        sections: { type: 'default', items },
        headerActions: {
            android: {
                startHeaderAction: {
                    type: 'back',
                    onPress: () => HybridAutoPlay.popTemplate(),
                },
                endHeaderActions: [playAction, shuffleAction],
            },
            ios: {
                backButton: {
                    type: 'back',
                    onPress: () => HybridAutoPlay.popTemplate(),
                },
                trailingNavigationBarButtons: [playAction, shuffleAction],
            },
        },
    });
}
