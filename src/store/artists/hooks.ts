/**
 * Database-backed hooks for artists
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import artists from './entity';
import { eq } from 'drizzle-orm';
import type { Artist } from './types';

export function useArtists(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(artists).where(eq(artists.sourceId, sourceId))
            : db.select().from(artists)
    );
    
    return useMemo(() => ({
        data: (data || []) as Artist[],
        error,
    }), [data, error]);
}

export function useArtist(id: string) {
    const { data, error } = useLiveQuery(
        id ? db.select().from(artists).where(eq(artists.id, id)).limit(1) : null
    );
    
    return useMemo(() => ({
        data: data?.[0] as Artist | undefined,
        error,
    }), [data, error]);
}
