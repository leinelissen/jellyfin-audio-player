import { db, sqliteDb } from '@/store';
import albumArtists from './entity';
import type { EntityId } from '@/store/types';
import type { Artist } from '../sources/types';

/**
 * Upsert album-artist relations for a given album.
 * Preserves order from the source by storing orderIndex.
 */
export async function upsertAlbumArtists(
    [sourceId, albumId]: EntityId,
    artistItems: Pick<Artist, 'id'>[],
): Promise<void> {
    if (artistItems.length === 0) return;

    for (const [orderIndex, artist] of artistItems.entries()) {
        await db.insert(albumArtists).values({
            sourceId,
            albumId,
            artistId: artist.id,
            orderIndex,
        }).onConflictDoUpdate({
            target: [albumArtists.sourceId, albumArtists.albumId, albumArtists.artistId],
            set: { orderIndex },
        });
    }

    sqliteDb.flushPendingReactiveQueries();
}