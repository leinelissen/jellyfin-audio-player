import { useLiveQuery, useFtsQuery } from '@/store/live-queries';
import { db } from '@/store';
import type { EntityId } from '@/store/types';
import type { Track } from './types';
import { useMemo } from 'react';

/** A track row with its local download entry attached (null when none exists). */
export type TrackWithDownload = NonNullable<
    ReturnType<typeof useTracksByAlbum>['data']
>[number];

export function useTracks() {
    return useLiveQuery(() => db.query.tracks.findMany());
}

export function useTrack(entityId: EntityId | null | undefined) {
    const [sourceId, id] = entityId ?? [];
    return useLiveQuery(
        () => (sourceId && id)
            ? db.query.tracks.findFirst({ where: { sourceId, id } })
            : undefined,
        [sourceId, id],
    );
}

export function useTrackWithDownload([sourceId, id]: EntityId) {
    return useLiveQuery(
        () => db.query.tracks.findFirst({
            where: { sourceId, id },
            with: { download: true },
        }),
        [sourceId, id],
    );
}

/**
 * Returns the ordered list of tracks belonging to the given album, each
 * paired with its download row (null when none exists).
 * Sorted in the DB by disc number then track number.
 */
export function useTracksByAlbum([sourceId, albumId]: EntityId) {
    return useLiveQuery(
        () => db.query.tracks.findMany({
            where: { sourceId, albumId },
            with: { download: true },
            orderBy: {
                parentIndexNumber: 'asc',
                indexNumber: 'asc',
            },
        }),
        [sourceId, albumId],
    );
}

/**
 * Full-text search across tracks using the tracks_fts virtual table.
 * Searches name, album, and album_artist columns. Returns at most 50 results.
 * Pass an empty string (or omit) to get no results.
 */
export function useTrackSearch(term: string) {
    const trimmed = term.trim();
    const matchTerm = trimmed ? trimmed + '*' : '';

    return useFtsQuery<Track>(
        `SELECT tracks.*
         FROM tracks_fts
         JOIN tracks ON tracks.rowid = tracks_fts.rowid
         WHERE tracks_fts MATCH ?
         ORDER BY rank
         LIMIT 50`,
        [matchTerm],
        ['tracks'],
        trimmed.length > 0,
    );
}

/**
 * Returns a live map of TrackWithDownload records keyed by track id, for a
 * given set of EntityIds. Useful for decorating a TrackPlayer queue (which
 * only holds minimal track info) with DB-backed download state.
 *
 * The returned map is re-computed whenever any of the watched tracks or
 * downloads change in the database.
 */
export function useTracksByIds(entityIds: EntityId[]): Map<string, TrackWithDownload> {
    // Build a stable source-id→[track-ids] grouping so the query changes only
    // when the actual set of ids changes, not on every render.
    const grouped = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const [sourceId, trackId] of entityIds) {
            if (!map.has(sourceId)) map.set(sourceId, []);
            map.get(sourceId)!.push(trackId);
        }
        return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(entityIds)]);

    // We only support a single sourceId for now — mixed-source queues are not
    // yet a use-case, so grab the first one.
    const [[sourceId, trackIds] = [undefined, undefined]] = grouped.entries();

    const { data } = useLiveQuery(
        () => (sourceId && trackIds?.length)
            ? db.query.tracks.findMany({
                where: { sourceId, id: { in: trackIds } },
                with: { download: true },
            })
            : undefined,
        [sourceId, trackIds],
    );

    return useMemo(() => {
        const map = new Map<string, TrackWithDownload>();
        for (const track of (data ?? []) as TrackWithDownload[]) {
            map.set(track.id, track);
        }
        return map;
    }, [data]);
}

/**
 * Returns the ordered list of tracks belonging to the given playlist,
 * each paired with its download row (null when none exists).
 * Sorted in the DB by the position column in playlist_tracks.
 */
export function useTracksByPlaylist([sourceId, playlistId]: EntityId) {
    const { data, error } = useLiveQuery(
        () => db.query.playlistTracks.findMany({
            where: { sourceId, playlistId },
            orderBy: { position: 'asc' },
            with: {
                track: {
                    with: { download: true },
                },
            },
        }),
        [sourceId, playlistId],
    );

    return {
        data: data?.flatMap(r => r.track ? [r.track] : []) ?? null,
        error,
    };
}