import { sql } from 'drizzle-orm';
import { useLiveQuery, useFtsQuery } from '@/store/live-queries';
import { db } from '@/store';
import { useMemo } from 'react';
import { groupByAlphabet } from '@/utility/groupByAlphabet';
import type { Artist } from './types';

export function useArtists(sourceId?: string) {
    return useLiveQuery(
        () => db.query.artists.findMany({
            where: sourceId ? { sourceId } : undefined,
            orderBy: (artists, { asc }) => [asc(sql`UPPER(${artists.name})`)],
        }),
        [sourceId],
    );
}

export function useArtist([sourceId, id]: [sourceId: string, id: string]) {
    return useLiveQuery(
        () => db.query.artists.findFirst({
            where: { sourceId, id },
        }),
        [sourceId, id],
    );
}

/**
 * Returns all artists grouped into alphabetical sections, sorted and grouped
 * by the artist name. The section key is the uppercase first letter of the
 * name, or '#' for non-alphabetic names. The '#' section is always placed
 * at the end.
 */
export function useArtistsByAlphabet(sourceId?: string) {
    const { data } = useLiveQuery(
        () => db.query.artists.findMany({
            where: sourceId ? { sourceId } : undefined,
            orderBy: (artists, { asc }) => [asc(sql`UPPER(${artists.name})`)],
        }),
        [sourceId],
    );

    return useMemo(
        () => groupByAlphabet(data ?? [], (artist) => artist.name),
        [data],
    );
}

/**
 * Full-text search across artists using the artists_fts virtual table.
 * Searches the name column. Returns at most 50 results.
 * Pass an empty string to get no results.
 */
export function useArtistSearch(term: string) {
    const trimmed = term.trim();
    const matchTerm = trimmed ? trimmed + '*' : '';

    return useFtsQuery<Artist>(
        `SELECT artists.*
         FROM artists_fts
         JOIN artists ON artists.rowid = artists_fts.rowid
         WHERE artists_fts MATCH ?
         ORDER BY rank
         LIMIT 50`,
        [matchTerm],
        ['artists'],
        trimmed.length > 0,
    );
}