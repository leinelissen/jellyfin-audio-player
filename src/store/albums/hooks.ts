/**
 * Database-backed hooks for albums
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import albums from './entity';
import { and, eq, desc } from 'drizzle-orm';

export function useAlbums(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(albums).where(eq(albums.sourceId, sourceId))
            : db.select().from(albums)
    );
    
    return useMemo(() => ({
        data: (data || []),
        error,
    }), [data, error]);
}

export function useAlbum([sourceId, id]: [sourceId: string, id: string]) {
    const { data, error } = useLiveQuery(
        db.select()
            .from(albums)
            .where(and(eq(albums.sourceId, sourceId), eq(albums.id, id)))
            .limit(1)
    );
    
    return useMemo(() => ({
        data: data?.[0],
        error,
    }), [data, error]);
}

export function useRecentAlbums(limit: number = 24) {
    const { data, error } = useLiveQuery(
        db.select().from(albums).orderBy(desc(albums.dateCreated)).limit(limit)
    );
    
    return useMemo(() => ({
        data: (data || []),
        error,
    }), [data, error]);
}
