/**
 * Database actions for artists
 */

import { db, sqliteDb } from '@/store';
import artists from './entity';
import { and, eq } from 'drizzle-orm';
import type { InsertArtist } from './types';
import type { EntityId } from '@/store/types';

/**
 * createdAt and updatedAt are optional — they reflect server-reported dates and
 * are stored as-is (null when the source does not provide them).
 * firstSyncedAt and lastSyncedAt are always managed by the schema: firstSyncedAt
 * is set once on insert and never overwritten; lastSyncedAt is set automatically
 * on every insert and update via $defaultFn/$onUpdateFn.
 */
type UpsertArtist = Omit<InsertArtist, 'firstSyncedAt' | 'lastSyncedAt'>;

export async function upsertArtist(artist: UpsertArtist): Promise<void> {
    await db.insert(artists).values({
        ...artist,
    }).onConflictDoUpdate({
        target: artists.id,
        set: {
            sourceId: artist.sourceId,
            name: artist.name,
            metadata: artist.metadata,
            // Use the source-provided dates as-is; null if the source omits them.
            createdAt: artist.createdAt,
            updatedAt: artist.updatedAt,
            // firstSyncedAt is intentionally excluded — preserve the original insert value.
            // lastSyncedAt is handled automatically by $onUpdateFn.
        },
    }).catch(console.error);

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertArtists(artistList: UpsertArtist[]): Promise<void> {
    for (const artist of artistList) {
        await upsertArtist(artist);
    }
}

export async function deleteArtist([sourceId, id]: EntityId): Promise<void> {
    await db.delete(artists).where(and(eq(artists.sourceId, sourceId), eq(artists.id, id)));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteArtistsBySource(sourceId: string): Promise<void> {
    await db.delete(artists).where(eq(artists.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}
