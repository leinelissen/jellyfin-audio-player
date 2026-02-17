import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import artists from './entity';
import { and, eq } from 'drizzle-orm';

export function useArtists(sourceId?: string) {
    return useLiveQuery(
        db.query.artists.findMany({
            where: sourceId ? eq(artists.sourceId, sourceId) : undefined,
        })
    );
}

export function useArtist([sourceId, id]: [sourceId: string, id: string]) {
    return useLiveQuery(
        db.query.artists.findFirst({
            where: and(eq(artists.sourceId, sourceId), eq(artists.id, id)),
        })
    );
}
