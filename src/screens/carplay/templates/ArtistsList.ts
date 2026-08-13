import { sql, desc, asc } from 'drizzle-orm';
import { ListTemplate, HybridAutoPlay } from '@iternio/react-native-auto-play';
import { t } from '@/localisation';
import { groupByAlphabet } from '@/utility/groupByAlphabet';
import { createAlbumDetailTemplate } from './AlbumsList';
import { db } from '@/store';
import type { Artist } from '@/store/artists/types';

/**
 * Creates a list template showing all artists grouped by alphabetical
 * sections, sorted alphabetically by name.
 */
export async function createArtistsTemplate(): Promise<ListTemplate> {
    console.log('[ArtistsList] Creating Artists template...');

    const artists = await db.query.artists.findMany({
        orderBy: (cols) => [asc(sql`UPPER(${cols.name})`)],
    });

    console.log('[ArtistsList] Total artists:', artists.length);

    const sections = groupByAlphabet(artists, artist => artist.name)
        .map(({ label, data: sectionArtists }) => ({
            type: 'default' as const,
            title: label,
            items: sectionArtists.map(artist => ({
                type: 'default' as const,
                title: { text: artist.name },
                onPress: async () => {
                    console.log('[ArtistsList] Artist selected:', artist.name);
                    try {
                        const detailTemplate = await createArtistDetailTemplate(artist);
                        await detailTemplate.push();
                        console.log('[ArtistsList] Artist detail pushed');
                    } catch (error) {
                        console.error('[ArtistsList] Error pushing artist detail:', error);
                    }
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

/**
 * Creates a detail template for a specific artist showing all their albums,
 * sorted by production year descending then name ascending.
 */
async function createArtistDetailTemplate(artist: Artist): Promise<ListTemplate> {
    const result = await db.query.artists.findFirst({
        where: { id: artist.id },
        with: {
            albums: {
                orderBy: (cols) => [
                    desc(sql`COALESCE(${cols.productionYear}, 0)`),
                    asc(sql`UPPER(${cols.name})`),
                ],
            },
        },
    });

    const albums = result?.albums ?? [];

    console.log('[ArtistsList] Artist albums:', albums.length);

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

    if (albums.length === 0) {
        return new ListTemplate({
            title: { text: artist.name },
            headerActions: backActions,
        });
    }

    const items = albums.map(album => ({
        type: 'default' as const,
        title: { text: album.name },
        detailedText: { text: album.productionYear?.toString() ?? t('album') },
        onPress: async () => {
            console.log('[ArtistsList] Album selected:', album.name);
            try {
                const detailTemplate = await createAlbumDetailTemplate(album);
                await detailTemplate.push();
                console.log('[ArtistsList] Album detail pushed');
            } catch (error) {
                console.error('[ArtistsList] Error opening album:', error);
            }
        },
    }));

    return new ListTemplate({
        title: { text: artist.name },
        sections: { type: 'default', items },
        headerActions: backActions,
    });
}