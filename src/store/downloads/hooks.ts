import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';

/** A download row with its associated track record attached (null when none exists). */
export type DownloadWithTrack = NonNullable<
    ReturnType<typeof useDownloads>['data']
>[number];

export function useDownloads(sourceId?: string) {
    return useLiveQuery(
        () => db.query.downloads.findMany({
            where: sourceId ? { sourceId } : undefined,
            with: { track: true },
        }),
        [sourceId],
    );
}

export function useDownload([sourceId, trackId]: [sourceId: string, trackId: string]) {
    return useLiveQuery(
        () => db.query.downloads.findFirst({
            where: { sourceId, id: trackId },
        }),
        [sourceId, trackId],
    );
}