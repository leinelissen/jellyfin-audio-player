/**
 * Database actions for albums
 */

import { db, sqliteDb } from '@/store';
import albums from './entity';
import { and, eq } from 'drizzle-orm';
import type { EntityId } from '@/store/types';
import type { InsertAlbum } from './types';

/**
 * createdAt and updatedAt are optional — they reflect server-side timestamps
 * and are stored as-is when provided, or left null when the server omits them.
 * firstSyncedAt and lastSyncedAt are fully managed by the schema and must never
 * be set manually: firstSyncedAt is set once on insert; lastSyncedAt is
 * updated automatically on every insert and update via $defaultFn/$onUpdateFn.
 */
type UpsertAlbum = Omit<InsertAlbum, 'firstSyncedAt' | 'lastSyncedAt'>;

export async function upsertAlbum(album: UpsertAlbum): Promise<void> {
    await db.insert(albums).values({
        ...album,
    }).onConflictDoUpdate({
        target: albums.id,
        set: {
            sourceId: album.sourceId,
            name: album.name,
            productionYear: album.productionYear,
            albumArtist: album.albumArtist,
            metadata: album.metadata,
            // Use the server-provided timestamps when available, otherwise null.
            // firstSyncedAt is intentionally excluded — it is set once on insert
            // and must never be overwritten.
            createdAt: album.createdAt ?? null,
            updatedAt: album.updatedAt ?? null,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertAlbums(albumList: UpsertAlbum[]): Promise<void> {
    for (const album of albumList) {
        await upsertAlbum(album);
    }
}

export async function deleteAlbum([sourceId, id]: EntityId): Promise<void> {
    await db.delete(albums).where(and(eq(albums.sourceId, sourceId), eq(albums.id, id)));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteAlbumsBySource(sourceId: string): Promise<void> {
    await db.delete(albums).where(eq(albums.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}
