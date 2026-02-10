/**
 * Database-backed hooks for playlists
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import playlists from './entity';
import { and, eq } from 'drizzle-orm';

export function usePlaylists(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId
            ? db.select().from(playlists).where(eq(playlists.sourceId, sourceId))
            : db.select().from(playlists)
    );
    
    return useMemo(() => ({
        data: data ?? [],
        error,
    }), [data, error]);
}

export function usePlaylist([sourceId, id]: [sourceId: string, id: string]) {
    const { data, error } = useLiveQuery(
        db.select()
            .from(playlists)
            .where(and(eq(playlists.sourceId, sourceId), eq(playlists.id, id)))
            .limit(1)
    );
    
    return useMemo(() => ({
        data: data?.[0],
        error,
    }), [data, error]);
}
