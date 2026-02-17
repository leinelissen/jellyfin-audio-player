import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import albums from './entity';
import { and, eq } from 'drizzle-orm';

export function useAlbums(sourceId?: string) {
    return useLiveQuery(
        db.query.albums.findMany({
            where: sourceId ? eq(albums.sourceId, sourceId) : undefined,
        })
    );
}

export function useAlbum([sourceId, id]: [sourceId: string, id: string]) {
    return useLiveQuery(
        db.query.albums.findFirst({
            where: and(eq(albums.sourceId, sourceId), eq(albums.id, id)) 
        })
    );
}

export function useRecentAlbums(limit: number = 24) {
    return useLiveQuery(
        db.query.albums.findMany({
            orderBy: (album, { desc }) => [desc(album.dateCreated)],
            limit,
        })
    );
}
