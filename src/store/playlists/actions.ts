/**
 * Database actions for playlists
 */

import { db, sqliteDb } from '@/store/db';
import { playlists } from './playlists';
import { playlistTracks } from '@/store/db/schema/playlist-tracks';
import { eq, and } from 'drizzle-orm';
import type { InsertPlaylist } from './types';

export async function upsertPlaylist(playlist: InsertPlaylist): Promise<void> {
    const now = Date.now();

    await db.insert(playlists).values({
        ...playlist,
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: playlists.id,
        set: {
            ...playlist,
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertPlaylists(playlistList: InsertPlaylist[]): Promise<void> {
    for (const playlist of playlistList) {
        await upsertPlaylist(playlist);
    }
}

export async function deletePlaylist(id: string): Promise<void> {
    await db.delete(playlists).where(eq(playlists.id, id));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deletePlaylistsBySource(sourceId: string): Promise<void> {
    await db.delete(playlists).where(eq(playlists.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}

export async function setPlaylistTracks(sourceId: string, playlistId: string, trackIds: string[]): Promise<void> {
    await db.delete(playlistTracks).where(
        and(
            eq(playlistTracks.sourceId, sourceId),
            eq(playlistTracks.playlistId, playlistId)
        )
    );

    if (trackIds.length > 0) {
        await db.insert(playlistTracks).values(
            trackIds.map((trackId, index) => ({
                sourceId,
                playlistId,
                trackId,
                position: index,
            }))
        );
    }

    sqliteDb.flushPendingReactiveQueries();
}
