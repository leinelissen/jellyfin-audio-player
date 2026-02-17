/**
 * Database-backed hooks for playlists
 */

import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import playlists from './entity';
import { and, eq } from 'drizzle-orm';

export function usePlaylists(sourceId?: string) {
    return useLiveQuery(
        db.query.playlists.findMany({
            where: sourceId ? eq(playlists.sourceId, sourceId) : undefined,
        })
    );
}

export function usePlaylist([sourceId, id]: [sourceId: string, id: string]) {
    return useLiveQuery(
        db.query.playlists.findFirst({
            where: and(eq(playlists.sourceId, sourceId), eq(playlists.id, id)),
        })
    );
}
