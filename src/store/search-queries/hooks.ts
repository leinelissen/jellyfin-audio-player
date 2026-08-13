/**
 * Database-backed hooks for search queries
 */

import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';

export function useSearchQueries(sourceId?: string, limit?: number) {
    return useLiveQuery(
        () => db.query.searchQueries.findMany({
            where: sourceId ? { sourceId } : undefined,
            orderBy: { createdAt: 'desc' },
            limit: limit || 100,
        }),
        [sourceId, limit],
    );
}