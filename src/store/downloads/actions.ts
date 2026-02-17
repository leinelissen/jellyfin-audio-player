import { db, sqliteDb } from '@/store';
import downloads from './entity';
import type { Download } from './types';
import { eq } from 'drizzle-orm';

export async function getAllDownloads(): Promise<Download[]> {
    const result = await db.select().from(downloads);
    return result as Download[];
}

export async function getDownload(id: string): Promise<Download | undefined> {
    const result = await db
        .select()
        .from(downloads)
        .where(eq(downloads.id, id))
        .limit(1);
    
    return result[0] as Download | undefined;
}

export async function initializeDownload(
    sourceId: string,
    id: string,
    hash?: string,
    filename?: string,
    mimetype?: string
): Promise<void> {
    const now = Date.now();
    
    await db.insert(downloads).values({
        sourceId,
        id,
        hash: hash || null,
        filename: filename || null,
        mimetype: mimetype || null,
        progress: 0,
        isFailed: false,
        isComplete: false,
        metadataJson: null,
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: downloads.id,
        set: {
            hash: hash || null,
            filename: filename || null,
            mimetype: mimetype || null,
            progress: 0,
            isFailed: false,
            isComplete: false,
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function updateDownloadProgress(
    id: string,
    progress: number
): Promise<void> {
    await db.update(downloads)
        .set({
            progress,
            updatedAt: Date.now(),
        })
        .where(eq(downloads.id, id));

    sqliteDb.flushPendingReactiveQueries();
}

export async function completeDownload(
    id: string,
    filename?: string
): Promise<void> {
    const updates: any = {
        isComplete: true,
        isFailed: false,
        progress: 1,
        updatedAt: Date.now(),
    };

    if (filename) {
        updates.filename = filename;
    }

    await db.update(downloads)
        .set(updates)
        .where(eq(downloads.id, id));

    sqliteDb.flushPendingReactiveQueries();
}

export async function failDownload(id: string): Promise<void> {
    await db.update(downloads)
        .set({
            isFailed: true,
            isComplete: false,
            progress: 0,
            updatedAt: Date.now(),
        })
        .where(eq(downloads.id, id));

    sqliteDb.flushPendingReactiveQueries();
}

export async function removeDownload(id: string): Promise<void> {
    await db.delete(downloads).where(eq(downloads.id, id));
    sqliteDb.flushPendingReactiveQueries();
}
