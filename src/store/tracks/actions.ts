/**
 * Database actions for tracks
 */

import { db, sqliteDb } from '@/store/db';
import { tracks } from './tracks';
import { eq } from 'drizzle-orm';
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

export async function deleteTrack(id: string): Promise<void> {
    await db.delete(tracks).where(eq(tracks.id, id));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteTracksBySource(sourceId: string): Promise<void> {
    await db.delete(tracks).where(eq(tracks.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteTracksByAlbum(albumId: string): Promise<void> {
    await db.delete(tracks).where(eq(tracks.albumId, albumId));
    sqliteDb.flushPendingReactiveQueries();
}
