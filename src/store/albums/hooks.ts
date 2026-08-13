import { sql } from 'drizzle-orm';
import { useLiveQuery, useFtsQuery } from '@/store/live-queries';
import { db } from '@/store';
import { useMemo } from 'react';
import type { Album } from './types';

import type { EntityId } from '@/store/types';
import { groupByAlphabet } from '@/utility/groupByAlphabet';

export function useAlbums() {
    return useLiveQuery(() => db.query.albums.findMany());
}

export function useAlbum([sourceId, id]: EntityId) {
    return useLiveQuery(
        () => db.query.albums.findFirst({ where: { sourceId, id } }),
        [sourceId, id],
    );
}

export function useRecentAlbums(limit: number = 24) {
    return useLiveQuery(
        () => db.query.albums.findMany({
            orderBy: { createdAt: 'desc' },
            limit,
        }),
        [limit],
    );
}

/**
 * Returns all albums grouped into alphabetical sections, sorted and grouped
 * by the album artist name (falling back to the album name). The section key
 * is the uppercase first letter of that value, or '#' for non-alphabetic names.
 * The '#' section is always placed at the end.
 */
export function useAlbumsByAlphabet() {
    const { data } = useLiveQuery(() => db.query.albums.findMany({
        orderBy: (albums, { asc }) => [
            asc(sql`UPPER(COALESCE(${albums.albumArtist}, ${albums.name}))`),
            asc(sql`UPPER(${albums.name})`),
        ],
    }));

    return useMemo(
        () => groupByAlphabet(data ?? [], (album) => album.albumArtist ?? album.name),
        [data],
    );
}

/**
 * Returns all albums that belong to a given artist via the through relation.
 * Pass [artist.sourceId, artist.id].
 */
export function useAlbumsByArtist([sourceId, artistId]: EntityId) {
    return useLiveQuery(
        () => db.query.artists.findFirst({
            where: { sourceId, id: artistId },
            with: { albums: true },
        }),
        [sourceId, artistId],
    );
}

/**
 * Full-text search across albums using the albums_fts virtual table.
 * Searches name and album_artist columns. Returns at most 50 results.
 * Pass an empty string (or omit) to get no results.
 */
export function useAlbumSearch(term: string) {
    const trimmed = term.trim();
    // Append * for prefix matching so e.g. "dark" matches "Darkness"
    const matchTerm = trimmed ? trimmed + '*' : '';

    return useFtsQuery<Album>(
        `SELECT albums.*
         FROM albums_fts
         JOIN albums ON albums.rowid = albums_fts.rowid
         WHERE albums_fts MATCH ?
         ORDER BY rank
         LIMIT 50`,
        [matchTerm],
        ['albums'],
        trimmed.length > 0,
    );
}

export function useAlbumSimilar([sourceId, albumId]: EntityId) {
    return useLiveQuery(
        () => db.query.albums.findFirst({
            where: { sourceId, id: albumId },
            with: { similarAlbums: true },
        }),
        [sourceId, albumId],
    );
}