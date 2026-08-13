import { db, sqliteDb } from '@/store';
import { and, eq } from 'drizzle-orm';
import tracks from './entity';
import type { EntityId } from '@/store/types';
import type { TrackLyrics } from '@/store/sources/types';

/**
 * Update lyrics content for a track.
 * Called after fetching lyrics from the source driver.
 * Note: updatedAt is intentionally not set here — it reflects the server-reported
 * last-modified date, not local operations. lastSyncedAt is bumped automatically
 * by the schema $onUpdateFn.
 */
export async function updateTrackLyrics([sourceId, trackId]: EntityId, lyrics: TrackLyrics | null): Promise<void> {
    await db.update(tracks)
        .set({
            lyrics,
        })
        .where(and(eq(tracks.sourceId, sourceId), eq(tracks.id, trackId)));

    sqliteDb.flushPendingReactiveQueries();
}