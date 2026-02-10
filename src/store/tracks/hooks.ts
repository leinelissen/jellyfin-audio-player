/**
 * Database-backed hooks for tracks with download joins
 */

import { and, eq } from 'drizzle-orm';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import tracks from './entity';

export function useTracks(sourceId?: string) {
    return useLiveQuery(
        sourceId 
            ? db.select().from(tracks).where(eq(tracks.sourceId, sourceId))
            : db.select().from(tracks)
    );
}

export function useTrack([sourceId, id]: [sourceId: string, id: string]) {
    return useLiveQuery(
        db.select()
            .from(tracks)
            .where(and(eq(tracks.sourceId, sourceId), eq(tracks.id, id)))
            .limit(1)
    );
}