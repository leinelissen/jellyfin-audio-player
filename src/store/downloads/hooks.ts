/**
 * Database-backed hooks for downloads data
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { downloads } from '@/store/db/schema/downloads';
import { eq } from 'drizzle-orm';
import { enrichDownload, type Download, type DownloadWithMetadata } from './db';

/**
 * Get all downloads for a source
 */
export function useDownloads(sourceId: string) {
    const { data, error } = useLiveQuery(
        sourceId ? db.select().from(downloads).where(eq(downloads.sourceId, sourceId)) : null
    );
    
    return useMemo(() => {
        const entities: Record<string, DownloadWithMetadata> = {};
        const ids: string[] = [];
        const queued: string[] = [];
        
        (data || []).forEach(download => {
            const enriched = enrichDownload(download as Download);
            entities[enriched.id] = enriched;
            ids.push(enriched.id);
            
            // If download is not complete and not failed, it's queued
            if (!enriched.isComplete && !enriched.isFailed) {
                queued.push(enriched.id);
            }
        });
        
        return { entities, ids, queued, error };
    }, [data, error]);
}

/**
 * Get a single download by id
 */
export function useDownload(trackId: string) {
    const { data, error } = useLiveQuery(
        trackId ? db.select().from(downloads).where(eq(downloads.id, trackId)).limit(1) : null
    );
    
    return useMemo(() => {
        const download = data?.[0] as Download | undefined;
        return {
            entity: download ? enrichDownload(download) : undefined,
            error
        };
    }, [data, error]);
}

/**
 * Check if a track is downloaded
 */
export function useIsDownloaded(trackId: string): boolean {
    const { entity } = useDownload(trackId);
    return entity?.isComplete === true;
}
