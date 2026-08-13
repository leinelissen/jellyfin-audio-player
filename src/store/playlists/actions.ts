/**
 * Database actions for playlists
 */

import { db, sqliteDb } from '@/store';
import playlists from './entity';
import { and, eq } from 'drizzle-orm';
import type { InsertPlaylist } from './types';
import type { EntityId } from '@/store/types';

/**
 * createdAt and updatedAt are optional — they reflect server-provided timestamps
 * and may be null if the server does not supply them.
 * firstSyncedAt and lastSyncedAt are omitted from the input type and managed
 * entirely by the schema: firstSyncedAt is set once on insert and never
 * overwritten; lastSyncedAt is set automatically on every insert and update.
 */
type UpsertPlaylist = Omit<InsertPlaylist, 'firstSyncedAt' | 'lastSyncedAt'>;

export async function upsertPlaylist(playlist: UpsertPlaylist): Promise<void> {
    await db.insert(playlists).values({
        ...playlist,
    }).onConflictDoUpdate({
        target: playlists.id,
        set: {
            sourceId: playlist.sourceId,
            name: playlist.name,
            canDelete: playlist.canDelete,
            childCount: playlist.childCount,
            metadata: playlist.metadata,
            // Take server-provided timestamps when available, otherwise leave null.
            // firstSyncedAt is intentionally excluded — it is set once on insert and never changed.
            createdAt: playlist.createdAt ?? null,
            updatedAt: playlist.updatedAt ?? null,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertPlaylists(playlistList: UpsertPlaylist[]): Promise<void> {
    for (const playlist of playlistList) {
        await upsertPlaylist(playlist);
    }
}

export async function deletePlaylist([sourceId, id]: EntityId): Promise<void> {
    await db.delete(playlists).where(and(eq(playlists.sourceId, sourceId), eq(playlists.id, id)));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deletePlaylistsBySource(sourceId: string): Promise<void> {
    await db.delete(playlists).where(eq(playlists.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}