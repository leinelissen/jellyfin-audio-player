/**
 * Database-backed hooks for downloads data
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import downloads from './entity';
import { eq } from 'drizzle-orm';
import type { Download } from './types';

export function useDownloads(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(downloads).where(eq(downloads.sourceId, sourceId))
            : db.select().from(downloads)
    );
    
    return useMemo(() => {
        const entities: Record<string, Download> = {};
        const ids: string[] = [];
        const queued: string[] = [];
        
        (data || []).forEach(download => {
            const d = download as Download;
            const metadata = d.metadataJson ? JSON.parse(d.metadataJson) : {};
            const normalized = { ...d, ...metadata } as Download;

            entities[normalized.id] = normalized;
            ids.push(normalized.id);
            
            if (!normalized.isComplete && !normalized.isFailed) {
                queued.push(normalized.id);
            }
        });
        
        return { 
            data: (data || []) as Download[],
            entities, 
            ids, 
            queued, 
            error 
        };
    }, [data, error]);
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
