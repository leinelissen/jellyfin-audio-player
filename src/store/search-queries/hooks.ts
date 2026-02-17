/**
 * Database-backed hooks for search queries
 */

import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import searchQueries from './entity';
import { eq } from 'drizzle-orm';

export function useSearchQueries(sourceId?: string, limit?: number) {
    return useLiveQuery(
        db.query.searchQueries.findMany({
            where: sourceId ? eq(searchQueries.sourceId, sourceId) : undefined,
            orderBy: (query, { desc }) => [desc(query.timestamp)],
            limit: limit || 100,
        })
    );
}
