import { ListTemplate, HybridAutoPlay } from '@iternio/react-native-auto-play';
import type { Store } from '@/store';
import type { MusicArtist } from '@/store/music/types';
import { t } from '@/localisation';
import { createAlbumDetailTemplate } from './AlbumsList';
import { ALPHABET_LETTERS } from '@/CONSTANTS';

export function createArtistsTemplate(store: Store): ListTemplate {
    console.log('[ArtistsList] Creating Artists template...');
    
    const state = store.getState();
    const artists = state.music.artists.ids
        .map(id => state.music.artists.entities[id])
        .filter((artist): artist is MusicArtist => artist !== undefined)
        .sort((a, b) => a.Name.toUpperCase().localeCompare(b.Name.toUpperCase()));

    console.log('[ArtistsList] Total artists:', artists.length);

    // Group into alphabetical sections
    const sectionMap = new Map<string, MusicArtist[]>();
    
    artists.forEach(artist => {
        const firstLetter = artist.Name[0].toUpperCase();
        const section = ALPHABET_LETTERS.includes(firstLetter) ? firstLetter : '#';
        
        if (!sectionMap.has(section)) {
            sectionMap.set(section, []);
        }
        sectionMap.get(section)!.push(artist);
    });

    const sections = Array.from(sectionMap.entries())
        .filter(([_, sectionArtists]) => sectionArtists.length > 0)
        .sort(([a], [b]) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        })
        .map(([letter, sectionArtists]) => ({
            type: 'default' as const,
            title: letter,
            items: sectionArtists.map(artist => ({
                type: 'default' as const,
                title: { text: artist.Name },
                onPress: () => {
                    console.log('[ArtistsList] Artist selected:', artist.Name);
                    const detailTemplate = createArtistDetailTemplate(store, artist);
                    detailTemplate.push();
                },
            })),
        }));

    return new ListTemplate({
        title: { text: t('artists') },
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

function createArtistDetailTemplate(store: Store, artist: MusicArtist): ListTemplate {
    const state = store.getState();
    
    // Find albums by this artist
    const albums = state.music.albums.ids
        .map(id => state.music.albums.entities[id])
        .filter(album => album?.ArtistItems?.find(item => item.Id === artist.Id))
        .filter((album): album is NonNullable<typeof album> => album !== undefined);
    
    console.log('[ArtistsList] Artist albums:', albums.length);

    const items = albums.map(album => ({
        type: 'default' as const,
        title: { text: album.Name },
        detailedText: { text: album.ProductionYear?.toString() || t('album') },
        onPress: async () => {
            console.log('[ArtistsList] Album selected:', album.Name);
            try {
                const detailTemplate = await createAlbumDetailTemplate(store, album);
                detailTemplate.push();
            } catch (error) {
                console.error('[ArtistsList] Error opening album:', error);
            }
        },
    }));

    // Play/shuffle actions removed - artist view shows albums, not tracks

    if (items.length === 0) {
        return new ListTemplate({
            title: { text: artist.Name },
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
        title: { text: artist.Name },
        sections: [{ type: 'default', title: '', items }],
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
