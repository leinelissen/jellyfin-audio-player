import { db, sqliteDb } from '@/store/db';
import { downloads } from '@/store/db/schema/downloads';
import type { Download } from '@/store/db/types';
import { eq } from 'drizzle-orm';

export interface DownloadMetadata {
    size?: number;
    error?: string;
    image?: string;
}

/**
 * Get all downloads for a source
 */
export async function getAllDownloads(sourceId: string): Promise<Download[]> {
    const result = await db
        .select()
        .from(downloads)
        .where(eq(downloads.sourceId, sourceId));
    
    return result as Download[];
}

/**
 * Get a single download by id
 */
export async function getDownload(id: string): Promise<Download | undefined> {
    const result = await db
        .select()
        .from(downloads)
        .where(eq(downloads.id, id))
        .limit(1);
    
    return result[0] as Download | undefined;
}

/**
 * Initialize a download
 */
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

/**
 * Update download progress
 */
export async function updateDownloadProgress(
    id: string,
    progress: number,
    metadata?: DownloadMetadata
): Promise<void> {
    const updates: any = {
        progress,
        updatedAt: Date.now(),
    };

    if (metadata) {
        // Merge with existing metadata
        const existing = await getDownload(id);
        const existingMetadata = existing ? parseDownloadMetadata(existing) : {};
        updates.metadataJson = JSON.stringify({ ...existingMetadata, ...metadata });
    }

    await db.update(downloads)
        .set(updates)
        .where(eq(downloads.id, id));

    sqliteDb.flushPendingReactiveQueries();
}

/**
 * Mark download as complete
 */
export async function completeDownload(
    id: string,
    filename?: string,
    imageFilename?: string
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
    
    // Merge image into existing metadata
    if (imageFilename) {
        const existing = await getDownload(id);
        const existingMetadata = existing ? parseDownloadMetadata(existing) : {};
        updates.metadataJson = JSON.stringify({ ...existingMetadata, image: imageFilename });
    }

    await db.update(downloads)
        .set(updates)
        .where(eq(downloads.id, id));

    sqliteDb.flushPendingReactiveQueries();
}

/**
 * Mark download as failed
 */
export async function failDownload(id: string, error?: string): Promise<void> {
    const metadata = error ? JSON.stringify({ error }) : null;

    await db.update(downloads)
        .set({
            isFailed: true,
            isComplete: false,
            progress: 0,
            metadataJson: metadata,
            updatedAt: Date.now(),
        })
        .where(eq(downloads.id, id));

    sqliteDb.flushPendingReactiveQueries();
}

/**
 * Remove a download
 */
export async function removeDownload(id: string): Promise<void> {
    await db.delete(downloads).where(eq(downloads.id, id));
    sqliteDb.flushPendingReactiveQueries();
}

/**
 * Parse download metadata
 */
export function parseDownloadMetadata(download: Download): DownloadMetadata {
    if (!download.metadataJson) {
        return {};
    }
    try {
        return JSON.parse(download.metadataJson);
    } catch {
        return {};
    }
}

/**
 * Get download with parsed metadata
 */
export interface DownloadWithMetadata extends Download {
    size?: number;
    error?: string;
    image?: string;
}

export function enrichDownload(download: Download): DownloadWithMetadata {
    const metadata = parseDownloadMetadata(download);
    return {
        ...download,
        ...metadata,
    };
}
