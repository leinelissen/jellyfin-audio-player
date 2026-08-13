import { db, sqliteDb } from '@/store';
import trackArtists from './entity';
import type { EntityId } from '@/store/types';

export async function upsertTrackArtists(
    [sourceId, trackId]: EntityId,
    artistItems: { id: string }[],
): Promise<void> {
    if (artistItems.length === 0) return;

    for (const [orderIndex, artist] of artistItems.entries()) {
        await db.insert(trackArtists).values({
            sourceId,
            trackId,
            artistId: artist.id,
            orderIndex,
        }).onConflictDoUpdate({
            target: [trackArtists.sourceId, trackArtists.trackId, trackArtists.artistId],
            set: { orderIndex },
        });
    }

    sqliteDb.flushPendingReactiveQueries();
}