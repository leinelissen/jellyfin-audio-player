/**
 * Database actions for albums
 */

import { db, sqliteDb } from '@/store';
import albums from './entity';
import { eq } from 'drizzle-orm';
import type { InsertAlbum } from './types';

export async function upsertAlbum(album: InsertAlbum): Promise<void> {
    const now = Date.now();

    await db.insert(albums).values({
        ...album,
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: albums.id,
        set: {
            ...album,
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertAlbums(albumList: InsertAlbum[]): Promise<void> {
    for (const album of albumList) {
        await upsertAlbum(album);
    }
}

export async function deleteAlbum(id: string): Promise<void> {
    await db.delete(albums).where(eq(albums.id, id));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteAlbumsBySource(sourceId: string): Promise<void> {
    await db.delete(albums).where(eq(albums.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}
