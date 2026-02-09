/**
 * Database-backed hooks for playlists
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import playlists from './entity';
import { eq } from 'drizzle-orm';
import type { Playlist } from './types';

export function usePlaylists(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(playlists).where(eq(playlists.sourceId, sourceId))
            : db.select().from(playlists)
    );
    
    return useMemo(() => ({
        data: (data || []) as Playlist[],
        error,
    }), [data, error]);
}

export function usePlaylist(id: string) {
    const { data, error } = useLiveQuery(
        id ? db.select().from(playlists).where(eq(playlists.id, id)).limit(1) : null
    );
    
    return useMemo(() => ({
        data: data?.[0] as Playlist | undefined,
        error,
    }), [data, error]);
}
