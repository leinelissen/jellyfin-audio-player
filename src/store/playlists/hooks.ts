/**
 * Database-backed hooks for playlists
 */

import { useLiveQuery, useFtsQuery } from '@/store/live-queries';
import { db } from '@/store';
import type { Playlist } from './types';

export function usePlaylists(sourceId?: string) {
    return useLiveQuery(
        () => db.query.playlists.findMany({
            where: sourceId ? { sourceId } : undefined,
        }),
        [sourceId],
    );
}

/**
 * Full-text search across playlists using the playlists_fts virtual table.
 * Searches the name column. Returns at most 50 results.
 * Pass an empty string to get no results.
 */
export function usePlaylistSearch(term: string) {
    const trimmed = term.trim();
    const matchTerm = trimmed ? trimmed + '*' : '';

    return useFtsQuery<Playlist>(
        `SELECT playlists.*
         FROM playlists_fts
         JOIN playlists ON playlists.rowid = playlists_fts.rowid
         WHERE playlists_fts MATCH ?
         ORDER BY rank
         LIMIT 50`,
        [matchTerm],
        ['playlists'],
        trimmed.length > 0,
    );
}

export function usePlaylist([sourceId, id]: [sourceId: string, id: string]) {
    return useLiveQuery(
        () => db.query.playlists.findFirst({
            where: { sourceId, id },
        }),
        [sourceId, id],
    );
}