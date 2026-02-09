/**
 * Database-backed hooks for search queries
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import searchQueries from './entity';
import { eq, desc } from 'drizzle-orm';
import type { SearchQuery } from './types';

export function useSearchQueries(sourceId?: string, limit?: number) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(searchQueries).where(eq(searchQueries.sourceId, sourceId)).orderBy(desc(searchQueries.timestamp)).limit(limit || 100)
            : db.select().from(searchQueries).orderBy(desc(searchQueries.timestamp)).limit(limit || 100)
    );
    
    return useMemo(() => ({
        data: (data || []) as SearchQuery[],
        error,
    }), [data, error]);
}
