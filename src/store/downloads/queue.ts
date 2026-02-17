import { DocumentDirectoryPath, downloadFile, exists, unlink } from 'react-native-fs';
import { db } from '@/store';
import sources from '@/store/sources/entity';
import downloads from '@/store/downloads/entity';
import { JellyfinDriver } from '@/store/sources/drivers/jellyfin/driver';
import { EmbyDriver } from '@/store/sources/drivers/emby/driver';
import type { Source, SourceDriver, SourceType } from '@/store/sources/types';
import { initializeDownload, updateDownloadProgress, completeDownload, failDownload, removeDownload } from './actions';
import { eq } from 'drizzle-orm';

async function getDriver(): Promise<{ driver: SourceDriver; source: Source } | null> {
    const result = await db.select().from(sources).limit(1);
    const row = result[0];

    if (!row) {
        return null;
    }

    const source: Source = {
        id: row.id,
        uri: row.uri,
        userId: row.userId || undefined,
        accessToken: row.accessToken || undefined,
        deviceId: row.deviceId || undefined,
        type: row.type as SourceType,
    };

    if (source.type.startsWith('jellyfin')) {
        return { driver: new JellyfinDriver(source), source };
    }

    if (source.type.startsWith('emby')) {
        return { driver: new EmbyDriver(source), source };
    }

    return null;
}

async function updateDownloadMetadata(id: string, updates: Record<string, unknown>): Promise<void> {
    const existing = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
    const current = existing[0];
    const currentMetadata = current?.metadataJson ? JSON.parse(current.metadataJson) : {};

    await db.update(downloads)
        .set({
            metadataJson: JSON.stringify({ ...currentMetadata, ...updates }),
            updatedAt: Date.now(),
        })
        .where(eq(downloads.id, id));
}

export async function queueTrackForDownload(trackId: string): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    await initializeDownload(driverResult.source.id, trackId);
}

export async function downloadTrack(trackId: string): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver } = driverResult;

    try {
        const info = await driver.getDownloadInfo(trackId);
        const destination = `${DocumentDirectoryPath}/${info.filename}`;

        await updateDownloadMetadata(trackId, { size: null, error: null });

        const job = downloadFile({
            fromUrl: info.url,
            toFile: destination,
            background: true,
            progress: (event) => {
                if (!event.contentLength) {
                    return;
                }
                const progress = event.bytesWritten / event.contentLength;
                updateDownloadProgress(trackId, progress);
                updateDownloadMetadata(trackId, { size: event.contentLength });
            },
        });

        await job.promise;
        await completeDownload(trackId, destination);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await updateDownloadMetadata(trackId, { error: message });
        await failDownload(trackId);
    }
}

export async function removeDownloadedTrack(trackId: string): Promise<void> {
    const downloadRow = await db.select().from(downloads).where(eq(downloads.id, trackId)).limit(1);
    const entry = downloadRow[0];

    if (entry?.filename) {
        const filePath = entry.filename.startsWith('/')
            ? entry.filename
            : `${DocumentDirectoryPath}/${entry.filename}`;

        if (await exists(filePath)) {
            await unlink(filePath);
        }
    }

    await removeDownload(trackId);
}
