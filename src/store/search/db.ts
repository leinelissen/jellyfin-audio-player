import { db, sqliteDb } from '@/store/db';
import { searchQueries } from '@/store/search-queries/search-queries';
import type { SearchQuery } from '@/store/db/types';
import { desc, eq } from 'drizzle-orm';

type SearchType = 'Audio' | 'MusicAlbum' | 'MusicArtist' | 'Playlist';

export interface SearchQueryDisplay {
    query: string;
    filters: SearchType[];
    localPlaybackOnly: boolean;
    timestamp: number;
}

/**
 * Get search history for a source (ordered by timestamp desc, limit 10)
 */
export async function getSearchHistory(sourceId: string): Promise<SearchQuery[]> {
    const result = await db
        .select()
        .from(searchQueries)
        .where(eq(searchQueries.sourceId, sourceId))
        .orderBy(desc(searchQueries.timestamp))
        .limit(10);
    
    return result as SearchQuery[];
}

/**
 * Add a search query to history
 */
export async function addSearchQuery(
    sourceId: string,
    query: string,
    filters: SearchType[],
    localPlaybackOnly: boolean
): Promise<void> {
    const now = Date.now();
    const id = `${sourceId}-${query}-${filters.sort().join(',')}-${localPlaybackOnly}`;
    const metadata = { filters };

    // Delete existing query with same parameters (to move it to top)
    await db.delete(searchQueries).where(eq(searchQueries.id, id));

    // Insert new query
    await db.insert(searchQueries).values({
        sourceId,
        id,
        query,
        timestamp: now,
        localPlaybackOnly,
        metadataJson: JSON.stringify(metadata),
        createdAt: now,
        updatedAt: now,
    });

    // Keep only last 10 queries for this source
    const allQueries = await getSearchHistory(sourceId);
    if (allQueries.length > 10) {
        const idsToDelete = allQueries.slice(10).map(q => q.id);
        for (const id of idsToDelete) {
            await db.delete(searchQueries).where(eq(searchQueries.id, id));
        }
    }

    sqliteDb.flushPendingReactiveQueries();
}

/**
 * Clear all search history for a source
 */
export async function clearSearchHistory(sourceId: string): Promise<void> {
    await db.delete(searchQueries).where(eq(searchQueries.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}

/**
 * Parse search queries to display format
 */
export function parseSearchQueries(queries: SearchQuery[]): SearchQueryDisplay[] {
    return queries.map(q => {
        const metadata = q.metadataJson ? JSON.parse(q.metadataJson) : { filters: [] };
        return {
            query: q.query,
            filters: metadata.filters || [],
            localPlaybackOnly: q.localPlaybackOnly,
            timestamp: q.timestamp,
        };
    });
}
