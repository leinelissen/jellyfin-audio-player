import { and, eq } from 'drizzle-orm';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import tracks from './entity';

export function useTracks(sourceId?: string) {
    return useLiveQuery(
        db.query.tracks.findMany({
            where: sourceId ? eq(tracks.sourceId, sourceId) : undefined,
        })
    );
}

export function useTrack([sourceId, id]: [sourceId: string, id: string]) {
    return useLiveQuery(
        db.query.tracks.findFirst({
            where: and(eq(tracks.sourceId, sourceId), eq(tracks.id, id)),
        })
    );
}