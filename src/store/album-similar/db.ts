import { db, sqliteDb } from '@/store';
import albumSimilar from './entity';
import type { EntityId } from '@/store/types';

export async function upsertAlbumSimilar(
    [sourceId, albumId]: EntityId,
    similarAlbumIds: string[],
): Promise<void> {
    if (similarAlbumIds.length === 0) return;

    for (const similarAlbumId of similarAlbumIds) {
        await db.insert(albumSimilar).values({
            sourceId,
            albumId,
            similarAlbumId,
        }).onConflictDoNothing();
    }

    sqliteDb.flushPendingReactiveQueries();
}