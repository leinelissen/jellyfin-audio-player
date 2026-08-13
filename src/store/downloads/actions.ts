import { db, sqliteDb } from '@/store';
import { and, eq } from 'drizzle-orm';
import downloads from './entity';

import type { EntityId } from '@/store/types';

export async function getAllDownloads() {
    return db.select().from(downloads).all();
}

export async function getDownload([sourceId, id]: EntityId) {
    return db.select().from(downloads)
        .where(and(eq(downloads.sourceId, sourceId), eq(downloads.id, id)))
        .get();
}

export interface InitialiseDownloadParams {
    filename: string;
    mimetype: string;
    hash?: string;
    fileSize?: number;
}

export async function initialiseDownload(
    [sourceId, id]: EntityId,
    {
        filename,
        mimetype,
        hash,
        fileSize,
    }: InitialiseDownloadParams
): Promise<void> {
    await db.insert(downloads).values({
        sourceId,
        id,
        hash: hash ?? null,
        filename: filename,
        mimetype: mimetype,
        fileSize: fileSize ?? null,
        progress: 0,
        isFailed: false,
        isComplete: false,
        metadata: null,
    }).onConflictDoUpdate({
        target: downloads.id,
        set: {
            hash: hash ?? null,
            filename: filename,
            mimetype: mimetype,
            fileSize: fileSize ?? null,
            progress: 0,
            isFailed: false,
            isComplete: false,
        },
    });

    await sqliteDb.flushPendingReactiveQueries();
}

export async function updateDownloadProgress(
    [sourceId, id]: EntityId,
    progress: number,
): Promise<void> {
    await db.update(downloads)
        .set({ progress })
        .where(and(eq(downloads.sourceId, sourceId), eq(downloads.id, id)));

    await sqliteDb.flushPendingReactiveQueries();
}

export interface CompleteDownloadParams {
    filename: string;
    fileSize?: number;
    artworkPath?: string;
}

export async function completeDownload(
    [sourceId, id]: EntityId,
    {
        filename,
        fileSize,
        artworkPath,
    }: CompleteDownloadParams
): Promise<void> {
    const updates: Partial<typeof downloads.$inferInsert> = {
        isComplete: true,
        isFailed: false,
        progress: 1,
        filename,
    };

    if (fileSize != null) updates.fileSize = fileSize;
    if (artworkPath) updates.artworkPath = artworkPath;

    await db.update(downloads)
        .set(updates)
        .where(and(eq(downloads.sourceId, sourceId), eq(downloads.id, id)));

    await sqliteDb.flushPendingReactiveQueries();
}

export async function failDownload([sourceId, id]: EntityId): Promise<void> {
    await db.update(downloads)
        .set({
            isFailed: true,
            isComplete: false,
            progress: 0,
        })
        .where(and(eq(downloads.sourceId, sourceId), eq(downloads.id, id)));

    await sqliteDb.flushPendingReactiveQueries();
}

export async function removeDownload([sourceId, id]: EntityId): Promise<void> {
    await db.delete(downloads)
        .where(and(eq(downloads.sourceId, sourceId), eq(downloads.id, id)));

    await sqliteDb.flushPendingReactiveQueries();
}
