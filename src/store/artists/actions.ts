/**
 * Database actions for artists
 */

import { db, sqliteDb } from '@/store/db';
import { artists } from './artists';
import { eq } from 'drizzle-orm';
import type { InsertArtist } from './types';

export async function upsertArtist(artist: InsertArtist): Promise<void> {
    const now = Date.now();

    await db.insert(artists).values({
        ...artist,
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: artists.id,
        set: {
            ...artist,
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertArtists(artistList: InsertArtist[]): Promise<void> {
    for (const artist of artistList) {
        await upsertArtist(artist);
    }
}

export async function deleteArtist(id: string): Promise<void> {
    await db.delete(artists).where(eq(artists.id, id));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteArtistsBySource(sourceId: string): Promise<void> {
    await db.delete(artists).where(eq(artists.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}
