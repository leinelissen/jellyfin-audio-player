import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import downloads from './entity';
import { and, eq } from 'drizzle-orm';

export function useDownloads(sourceId?: string) {
    return useLiveQuery(
        db.query.downloads.findMany({
            where: sourceId ? eq(downloads.sourceId, sourceId) : undefined,
        })
    );
}

export function useDownload([sourceId, trackId]: [sourceId: string, trackId: string]) {
    return useLiveQuery(
        db.query.downloads.findFirst({
            where: and(eq(downloads.sourceId, sourceId), eq(downloads.id, trackId)),
        })
    );
}
