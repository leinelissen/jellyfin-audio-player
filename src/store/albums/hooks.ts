/**
 * Database-backed hooks for albums
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { albums } from './albums';
import { eq, desc } from 'drizzle-orm';
import type { Album } from './types';

export function useAlbums(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(albums).where(eq(albums.sourceId, sourceId))
            : db.select().from(albums)
    );
    
    return useMemo(() => ({
        data: (data || []) as Album[],
        error,
    }), [data, error]);
}

export function useAlbum(id: string) {
    const { data, error } = useLiveQuery(
        id ? db.select().from(albums).where(eq(albums.id, id)).limit(1) : null
    );
    
    return useMemo(() => ({
        data: data?.[0] as Album | undefined,
        error,
    }), [data, error]);
}

export function useRecentAlbums(limit: number = 24, sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId
            ? db.select().from(albums).where(eq(albums.sourceId, sourceId)).orderBy(desc(albums.dateCreated)).limit(limit)
            : db.select().from(albums).orderBy(desc(albums.dateCreated)).limit(limit)
    );
    
    return useMemo(() => ({
        data: (data || []) as Album[],
        error,
    }), [data, error]);
}
