import { ListTemplate, HybridAutoPlay } from '@iternio/react-native-auto-play';
import type { Album } from '@/store/music/types';
import { t } from '@/localisation';
import { fetchTracksByAlbum } from '@/store/music/actions';
import { ALPHABET_LETTERS } from '@/CONSTANTS';
import { playTracks } from '@/utility/usePlayTracks';
import store from '@/store';

/**
 * Creates a list template showing the 24 most recently added albums,
 * sorted by creation date in descending order.
 */
export function createRecentAlbumsTemplate(): ListTemplate {
    console.log('[AlbumsList] Creating Recent Albums template...');
    
    const state = store.getState();
    
    const allAlbums = state.music.albums.ids
        .map(id => state.music.albums.entities[id])
        .filter((album): album is Album => album !== undefined);
    
    const albumsWithDates = allAlbums.filter(album => album.DateCreated !== undefined);
    const albums = albumsWithDates
        .sort((a, b) => {
            const dateA = new Date(a.DateCreated!).getTime();
            const dateB = new Date(b.DateCreated!).getTime();
            return dateB - dateA;
        })
        .slice(0, 24);

    console.log('[AlbumsList] Recent albums count:', albums.length);

        const items = albums.map(album => ({
            type: 'default' as const,
            title: { text: album.Name },
            detailedText: { text: album.AlbumArtist || t('unknown-artist') },
            onPress: async () => {
                console.log('[AlbumsList] Album selected:', album.Name);
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
export function createAllAlbumsTemplate(): ListTemplate {
    console.log('[AlbumsList] Creating All Albums template...');
    
    const state = store.getState();
    const albums = state.music.albums.ids
        .map(id => state.music.albums.entities[id])
        .filter((album): album is Album => album !== undefined)
        .sort((a, b) => {
            const artistA = (a.AlbumArtist || a.Artists?.[0] || t('unknown-artist')).toUpperCase();
            const artistB = (b.AlbumArtist || b.Artists?.[0] || t('unknown-artist')).toUpperCase();
            if (artistA < artistB) return -1;
            if (artistA > artistB) return 1;
            const nameA = a.Name.toUpperCase();
            const nameB = b.Name.toUpperCase();
            return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
        });

    console.log('[AlbumsList] Total albums:', albums.length);

    // Group into alphabetical sections
    const sectionMap = new Map<string, Album[]>();
    
    albums.forEach(album => {
        const firstLetter = (album.AlbumArtist || album.Artists?.[0] || '#')[0].toUpperCase();
        const section = ALPHABET_LETTERS.includes(firstLetter) ? firstLetter : '#';
        
        if (!sectionMap.has(section)) {
            sectionMap.set(section, []);
        }
        sectionMap.get(section)!.push(album);
    });

    const sections = Array.from(sectionMap.entries())
        .filter(([_, sectionAlbums]) => sectionAlbums.length > 0)
        .sort(([a], [b]) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        })
        .map(([letter, sectionAlbums]) => ({
            type: 'default' as const,
            title: letter,
            items: sectionAlbums.map(album => ({
                type: 'default' as const,
                title: { text: album.Name },
                detailedText: { text: album.AlbumArtist || t('unknown-artist') },
                onPress: async () => {
                    console.log('[AlbumsList] Album selected:', album.Name);
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
 * with play and shuffle actions. Fetches tracks from the API if they're
 * not already in the store.
 */
export async function createAlbumDetailTemplate(album: Album): Promise<ListTemplate> {
    let state = store.getState();
    let trackIds = state.music.tracks.byAlbum[album.Id] || [];
    
    // Only fetch if tracks are missing
    if (trackIds.length === 0) {
        console.log('[AlbumsList] Tracks missing, fetching for album:', album.Name);
        await store.dispatch(fetchTracksByAlbum(album.Id));
        state = store.getState();
        trackIds = state.music.tracks.byAlbum[album.Id] || [];
    }
    
    const tracks = trackIds
        .map(id => state.music.tracks.entities[id])
        .filter((track): track is NonNullable<typeof track> => track !== undefined);
    
    console.log('[AlbumsList] Album tracks:', tracks.length);

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
                console.error('[AlbumsList] Error playing track:', error);
            }
        },
    }));

    const playAction = {
        type: 'text' as const,
        title: t('play'),
        onPress: async () => {
            console.log('[AlbumsList] Play album:', album.Name);
            try {
                await playTracks(
                    trackIds,
                    state.music.tracks.entities,
                    state.downloads.entities
                );
            } catch (error) {
                console.error('[AlbumsList] Error playing album:', error);
            }
        },
    };

    const shuffleAction = {
        type: 'text' as const,
        title: t('shuffle'),
        onPress: async () => {
            console.log('[AlbumsList] Shuffle album:', album.Name);
            try {
                await playTracks(
                    trackIds,
                    state.music.tracks.entities,
                    state.downloads.entities,
                    { shuffle: true }
                );
            } catch (error) {
                console.error('[AlbumsList] Error shuffling album:', error);
            }
        },
    };

    if (items.length === 0) {
        return new ListTemplate({
            title: { text: album.Name },
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
        title: { text: album.Name },
        sections: {
            type: 'default',
            items,
        },
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
