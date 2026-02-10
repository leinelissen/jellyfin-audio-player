/**
 * Database-backed hooks for artists
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import artists from './entity';
import { and, eq } from 'drizzle-orm';

export function useArtists(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId
            ? db.select().from(artists).where(eq(artists.sourceId, sourceId))
            : db.select().from(artists)
    );
    
    return useMemo(() => ({
        data: data ?? [],
        error,
    }), [data, error]);
}

export function useArtist([sourceId, id]: [sourceId: string, id: string]) {
    const { data, error } = useLiveQuery(
        db.select()
            .from(artists)
            .where(and(eq(artists.sourceId, sourceId), eq(artists.id, id)))
            .limit(1)
    );
    
    return useMemo(() => ({
        data: data?.[0],
        error,
    }), [data, error]);
}
