/**
 * Prefill Orchestrator
 * 
 * Manages the automated prefill of data from sources into the local database.
 * Uses p-queue for bounded concurrency and supports cursor-based resume.
 */

import PQueue from 'p-queue';
import { db } from '../db/index';
import type { SourceDriver } from '../sources/types';
import type { InsertSyncCursor } from '../db/types';
import { syncCursors } from '../db/schema/sync-cursors';
import { eq, and } from 'drizzle-orm';

/**
 * Entity types that can be prefilled
 */
export enum EntityType {
    ARTISTS = 'artists',
    ALBUMS = 'albums',
    PLAYLISTS = 'playlists',
    ALBUM_TRACKS = 'album_tracks',
    PLAYLIST_TRACKS = 'playlist_tracks',
    SIMILAR_ALBUMS = 'similar_albums',
    LYRICS = 'lyrics',
}

/**
 * Progress callback for prefill operations
 */
export interface PrefillProgress {
    entityType: EntityType;
    totalFetched: number;
    hasMore: boolean;
    error?: Error;
}

export type PrefillProgressCallback = (progress: PrefillProgress) => void;

/**
 * Prefill configuration
 */
export interface PrefillConfig {
    /** Maximum number of concurrent requests */
    concurrency?: number;
    /** Page size for list operations */
    pageSize?: number;
    /** Progress callback */
    onProgress?: PrefillProgressCallback;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<PrefillConfig, 'onProgress'>> = {
    concurrency: 5,
    pageSize: 500,
};

/**
 * Get sync cursor for resuming prefill
 */
async function getSyncCursor(
    sourceId: string,
    entityType: EntityType
): Promise<number> {
    const cursor = await db
        .select()
        .from(syncCursors)
        .where(
            and(
                eq(syncCursors.sourceId, sourceId),
                eq(syncCursors.entityType, entityType)
            )
        )
        .limit(1);

    return cursor[0]?.offset || 0;
}

/**
 * Update sync cursor
 */
async function updateSyncCursor(
    sourceId: string,
    entityType: EntityType,
    offset: number
) {
    const now = Date.now();
    
    await db
        .insert(syncCursors)
        .values({
            sourceId,
            entityType,
            offset,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [syncCursors.sourceId, syncCursors.entityType],
            set: {
                offset,
                updatedAt: now,
            },
        });
}

/**
 * Prefill orchestrator for basic entities (artists, albums, playlists)
 */
export class PrefillOrchestrator {
    private queue: PQueue;
    private config: Required<Omit<PrefillConfig, 'onProgress'>> & Pick<PrefillConfig, 'onProgress'>;
    private sourceId: string;
    private driver: SourceDriver;

    constructor(sourceId: string, driver: SourceDriver, config: PrefillConfig = {}) {
        this.sourceId = sourceId;
        this.driver = driver;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        };
        this.queue = new PQueue({ concurrency: this.config.concurrency });
    }

    /**
     * Report progress
     */
    private reportProgress(progress: PrefillProgress) {
        if (this.config.onProgress) {
            this.config.onProgress(progress);
        }
    }

    /**
     * Prefill artists
     */
    async prefillArtists(): Promise<void> {
        const entityType = EntityType.ARTISTS;
        let offset = await getSyncCursor(this.sourceId, entityType);
        let hasMore = true;
        let totalFetched = 0;

        while (hasMore) {
            try {
                const artists = await this.driver.getArtists({
                    offset,
                    limit: this.config.pageSize,
                });

                if (artists.length === 0) {
                    hasMore = false;
                    break;
                }

                // Insert artists into database
                const now = Date.now();
                await db.insert(syncCursors).values(
                    artists.map(artist => ({
                        sourceId: this.sourceId,
                        id: artist.id,
                        name: artist.name,
                        isFolder: artist.isFolder,
                        metadataJson: JSON.stringify(artist),
                        createdAt: now,
                        updatedAt: now,
                    }))
                ).onConflictDoUpdate({
                    target: [syncCursors.sourceId, syncCursors.id],
                    set: {
                        name: artists[0].name,
                        isFolder: artists[0].isFolder,
                        metadataJson: JSON.stringify(artists[0]),
                        updatedAt: now,
                    },
                });

                totalFetched += artists.length;
                offset += artists.length;

                await updateSyncCursor(this.sourceId, entityType, offset);

                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: artists.length === this.config.pageSize,
                });

                hasMore = artists.length === this.config.pageSize;
            } catch (error) {
                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: false,
                    error: error instanceof Error ? error : new Error(String(error)),
                });
                throw error;
            }
        }
    }

    /**
     * Prefill albums
     */
    async prefillAlbums(): Promise<void> {
        const entityType = EntityType.ALBUMS;
        let offset = await getSyncCursor(this.sourceId, entityType);
        let hasMore = true;
        let totalFetched = 0;

        while (hasMore) {
            try {
                const albums = await this.driver.getAlbums({
                    offset,
                    limit: this.config.pageSize,
                });

                if (albums.length === 0) {
                    hasMore = false;
                    break;
                }

                // Albums will be inserted by upsert logic
                // This is a placeholder - actual implementation would use proper upsert

                totalFetched += albums.length;
                offset += albums.length;

                await updateSyncCursor(this.sourceId, entityType, offset);

                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: albums.length === this.config.pageSize,
                });

                hasMore = albums.length === this.config.pageSize;
            } catch (error) {
                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: false,
                    error: error instanceof Error ? error : new Error(String(error)),
                });
                throw error;
            }
        }
    }

    /**
     * Prefill playlists
     */
    async prefillPlaylists(): Promise<void> {
        const entityType = EntityType.PLAYLISTS;
        let offset = await getSyncCursor(this.sourceId, entityType);
        let hasMore = true;
        let totalFetched = 0;

        while (hasMore) {
            try {
                const playlists = await this.driver.getPlaylists({
                    offset,
                    limit: this.config.pageSize,
                });

                if (playlists.length === 0) {
                    hasMore = false;
                    break;
                }

                // Playlists will be inserted by upsert logic
                // This is a placeholder - actual implementation would use proper upsert

                totalFetched += playlists.length;
                offset += playlists.length;

                await updateSyncCursor(this.sourceId, entityType, offset);

                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: playlists.length === this.config.pageSize,
                });

                hasMore = playlists.length === this.config.pageSize;
            } catch (error) {
                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: false,
                    error: error instanceof Error ? error : new Error(String(error)),
                });
                throw error;
            }
        }
    }

    /**
     * Run complete prefill
     */
    async runPrefill(): Promise<void> {
        await this.queue.add(() => this.prefillArtists());
        await this.queue.add(() => this.prefillAlbums());
        await this.queue.add(() => this.prefillPlaylists());
        
        await this.queue.onIdle();
    }

    /**
     * Get queue size
     */
    getQueueSize(): number {
        return this.queue.size;
    }

    /**
     * Get pending tasks
     */
    getPending(): number {
        return this.queue.pending;
    }
}

/**
 * Helper function to run prefill
 */
export async function runPrefill(
    sourceId: string,
    driver: SourceDriver,
    config?: PrefillConfig
): Promise<void> {
    const orchestrator = new PrefillOrchestrator(sourceId, driver, config);
    await orchestrator.runPrefill();
}
