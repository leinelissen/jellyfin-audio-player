/**
 * Database-backed hooks for downloads data
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import downloads from './entity';
import { and, eq } from 'drizzle-orm';
import type { Download } from './types';

export function useDownloads(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(downloads).where(eq(downloads.sourceId, sourceId))
            : db.select().from(downloads)
    );
    
        
    return { 
        data: data ?? [],
        error 
    };
}

export function useDownload([sourceId, trackId]: [sourceId: string, trackId: string]) {
    const { data, error } = useLiveQuery(
        db.select()
            .from(downloads)
            .where(and(eq(downloads.sourceId, sourceId), eq(downloads.id, trackId)))
            .limit(1)
    );
    
    return useMemo(() => ({
        data: data?.[0],
        error,
    }), [data, error]);
}

export function useIsDownloaded([sourceId, trackId]: [sourceId: string, trackId: string]): boolean {
    const { data } = useDownload([sourceId, trackId]);
    return data?.isComplete === true;
}
