/**
 * Database actions for tracks
 */

import { db, sqliteDb } from '@/store';
import tracks from './entity';
import type { InsertTrack } from './types';

export async function upsertTrack(track: InsertTrack): Promise<void> {
    const now = Date.now();

    await db.insert(tracks).values({
        ...track,
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: tracks.id,
        set: {
            ...track,
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertTracks(trackList: InsertTrack[]): Promise<void> {
    for (const track of trackList) {
        await upsertTrack(track);
    }
}