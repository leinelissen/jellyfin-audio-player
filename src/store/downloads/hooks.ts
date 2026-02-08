/**
 * Database-backed hooks for downloads data
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { downloads } from './downloads';
import { eq } from 'drizzle-orm';
import type { Download } from './types';

export function useDownloads(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(downloads).where(eq(downloads.sourceId, sourceId))
            : db.select().from(downloads)
    );
    
    return useMemo(() => ({
        data: (data || []) as Download[],
        error,
    }), [data, error]);
}

export function useDownload(trackId: string) {
    const { data, error } = useLiveQuery(
        trackId ? db.select().from(downloads).where(eq(downloads.id, trackId)).limit(1) : null
    );
    
    return useMemo(() => ({
        data: data?.[0] as Download | undefined,
        error,
    }), [data, error]);
}

export function useIsDownloaded(trackId: string): boolean {
    const { data } = useDownload(trackId);
    return data?.isComplete === true;
}
