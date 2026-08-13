/**
 * Database actions for tracks
 */

import { db, sqliteDb } from '@/store';
import tracks from './entity';
import downloads from '../downloads/entity';
import { inArray, eq } from 'drizzle-orm';
import type { InsertTrack, Track } from './types';
import type { TrackWithDownload } from './hooks';

/**
 * createdAt and updatedAt are optional — they reflect server-provided timestamps
 * and are stored as-is. Null when the server does not supply them.
 *
 * firstSyncedAt and lastSyncedAt are always managed by the schema and are
 * excluded from the upsert type: firstSyncedAt is set once on insert and never
 * overwritten; lastSyncedAt is set automatically on every insert and update.
 */
type UpsertTrack = Omit<InsertTrack, 'firstSyncedAt' | 'lastSyncedAt'>;

export async function upsertTrack(track: UpsertTrack): Promise<void> {
    await db.insert(tracks).values({
        ...track,
    }).onConflictDoUpdate({
        target: tracks.id,
        set: {
            sourceId: track.sourceId,
            name: track.name,
            albumId: track.albumId,
            album: track.album,
            albumArtist: track.albumArtist,
            productionYear: track.productionYear,
            indexNumber: track.indexNumber,
            parentIndexNumber: track.parentIndexNumber,
            runTimeTicks: track.runTimeTicks,
            metadata: track.metadata,
            // createdAt and updatedAt reflect source-provided values; store as-is.
            createdAt: track.createdAt,
            updatedAt: track.updatedAt,
            // firstSyncedAt is intentionally absent — preserve the original insert value.
            // lastSyncedAt is intentionally absent — the schema $onUpdateFn handles it.
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertTracks(trackList: UpsertTrack[]): Promise<void> {
    for (const track of trackList) {
        await upsertTrack(track);
    }
}

/**
 * Given an ordered list of tracks (e.g. from an instant mix API response),
 * look each one up in the local database by ID to retrieve the full DB row
 * including its download entry. Tracks not found locally are dropped — they
 * haven't been synced yet and can't be played from the queue anyway.
 * The returned array preserves the original order.
 */
export async function getTracksWithDownloadsByIds(
    sourceTracks: Pick<Track, 'id'>[],
): Promise<TrackWithDownload[]> {
    const ids = sourceTracks.map(t => t.id);

    const rows = await db
        .select({
            // track columns
            id: tracks.id,
            sourceId: tracks.sourceId,
            name: tracks.name,
            albumId: tracks.albumId,
            album: tracks.album,
            albumArtist: tracks.albumArtist,
            productionYear: tracks.productionYear,
            indexNumber: tracks.indexNumber,
            parentIndexNumber: tracks.parentIndexNumber,
            runTimeTicks: tracks.runTimeTicks,
            lyrics: tracks.lyrics,
            metadata: tracks.metadata,
            firstSyncedAt: tracks.firstSyncedAt,
            lastSyncedAt: tracks.lastSyncedAt,
            createdAt: tracks.createdAt,
            updatedAt: tracks.updatedAt,
            // download columns (null when no download row exists)
            download: {
                id: downloads.id,
                sourceId: downloads.sourceId,
                hash: downloads.hash,
                filename: downloads.filename,
                artworkPath: downloads.artworkPath,
                mimetype: downloads.mimetype,
                fileSize: downloads.fileSize,
                progress: downloads.progress,
                isFailed: downloads.isFailed,
                isComplete: downloads.isComplete,
                metadata: downloads.metadata,
                createdAt: downloads.createdAt,
                updatedAt: downloads.updatedAt,
            },
        })
        .from(tracks)
        .leftJoin(downloads, eq(downloads.id, tracks.id))
        .where(inArray(tracks.id, ids));

    // Map nulls on the download sub-object back to a single null when no row matched
    const mapped: TrackWithDownload[] = rows.map(row => ({
        ...row,
        download: row.download?.id !== null ? row.download as NonNullable<TrackWithDownload['download']> : null,
    }));

    // Restore the original ordering from the API response
    const byId = new Map(mapped.map(r => [r.id, r]));
    return ids.flatMap(id => {
        const row = byId.get(id);
        return row ? [row] : [];
    });
}