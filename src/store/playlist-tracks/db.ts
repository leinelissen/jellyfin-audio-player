import { db, sqliteDb } from '@/store';
import { eq, and } from 'drizzle-orm';
import playlistTracks from './entity';
import type { EntityId } from '@/store/types';

/**
 * Replaces all tracks for a playlist with the provided ordered list of track IDs.
 * Deletes existing entries first to handle removals and reordering.
 */
export async function setPlaylistTracks(
    [sourceId, playlistId]: EntityId,
    trackIds: string[],
): Promise<void> {
    await db.delete(playlistTracks).where(
        and(
            eq(playlistTracks.sourceId, sourceId),
            eq(playlistTracks.playlistId, playlistId),
        )
    );

    if (trackIds.length > 0) {
        await db.insert(playlistTracks).values(
            trackIds.map((trackId, position) => ({
                sourceId,
                playlistId,
                trackId,
                position,
            }))
        );
    }

    sqliteDb.flushPendingReactiveQueries();
}