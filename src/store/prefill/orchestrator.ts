/**
 * Prefill Orchestrator
 * 
 * Manages the automated prefill of data from sources into the local database.
 * Uses p-queue for bounded concurrency and supports cursor-based resume.
 */

import PQueue from 'p-queue';
import { db } from '../db/index';
import type { SourceDriver } from '../sources/types';
import { syncCursors } from '../db/schema/sync-cursors';
import { artists } from '../db/schema/artists';
import { albums } from '../db/schema/albums';
import { playlists } from '../db/schema/playlists';
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

    return cursor[0]?.startIndex || 0;
}

/**
 * Update sync cursor
 */
async function updateSyncCursor(
    sourceId: string,
    entityType: EntityType,
    startIndex: number,
    pageSize: number,
    completed: boolean
) {
    const now = Date.now();
    
    await db
        .insert(syncCursors)
        .values({
            sourceId,
            entityType,
            startIndex,
            pageSize,
            completed,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [syncCursors.sourceId, syncCursors.entityType],
            set: {
                startIndex,
                pageSize,
                completed,
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
                const artistsData = await this.driver.getArtists({
                    offset,
                    limit: this.config.pageSize,
                });

                if (artistsData.length === 0) {
                    hasMore = false;
                    break;
                }

                // Insert artists into database
                const now = Date.now();
                await db.insert(artists).values(
                    artistsData.map(artist => ({
                        sourceId: this.sourceId,
                        id: artist.id,
                        name: artist.name,
                        isFolder: artist.isFolder,
                        metadataJson: artist.metadataJson,
                        createdAt: now,
                        updatedAt: now,
                    }))
                ).onConflictDoUpdate({
                    target: [artists.id],
                    set: {
                        name: artistsData[0].name,
                        isFolder: artistsData[0].isFolder,
                        metadataJson: artistsData[0].metadataJson,
                        updatedAt: now,
                    },
                });

                totalFetched += artistsData.length;
                offset += artistsData.length;

                await updateSyncCursor(
                    this.sourceId,
                    entityType,
                    offset,
                    this.config.pageSize,
                    artistsData.length < this.config.pageSize
                );

                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: artistsData.length === this.config.pageSize,
                });

                hasMore = artistsData.length === this.config.pageSize;
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
                const albumsData = await this.driver.getAlbums({
                    offset,
                    limit: this.config.pageSize,
                });

                if (albumsData.length === 0) {
                    hasMore = false;
                    break;
                }

                // Insert albums into database
                const now = Date.now();
                await db.insert(albums).values(
                    albumsData.map(album => ({
                        sourceId: this.sourceId,
                        id: album.id,
                        name: album.name,
                        productionYear: album.productionYear ?? null,
                        isFolder: album.isFolder,
                        albumArtist: album.albumArtist ?? null,
                        dateCreated: album.dateCreated ?? null,
                        lastRefreshed: null,
                        metadataJson: album.metadataJson,
                        createdAt: now,
                        updatedAt: now,
                    }))
                ).onConflictDoUpdate({
                    target: [albums.id],
                    set: {
                        name: albumsData[0].name,
                        productionYear: albumsData[0].productionYear ?? null,
                        isFolder: albumsData[0].isFolder,
                        albumArtist: albumsData[0].albumArtist ?? null,
                        dateCreated: albumsData[0].dateCreated ?? null,
                        metadataJson: albumsData[0].metadataJson,
                        updatedAt: now,
                    },
                });

                totalFetched += albumsData.length;
                offset += albumsData.length;

                await updateSyncCursor(
                    this.sourceId,
                    entityType,
                    offset,
                    this.config.pageSize,
                    albumsData.length < this.config.pageSize
                );

                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: albumsData.length === this.config.pageSize,
                });

                hasMore = albumsData.length === this.config.pageSize;
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
                const playlistsData = await this.driver.getPlaylists({
                    offset,
                    limit: this.config.pageSize,
                });

                if (playlistsData.length === 0) {
                    hasMore = false;
                    break;
                }

                // Insert playlists into database
                const now = Date.now();
                await db.insert(playlists).values(
                    playlistsData.map(playlist => ({
                        sourceId: this.sourceId,
                        id: playlist.id,
                        name: playlist.name,
                        canDelete: playlist.canDelete,
                        childCount: playlist.childCount ?? null,
                        lastRefreshed: null,
                        metadataJson: playlist.metadataJson,
                        createdAt: now,
                        updatedAt: now,
                    }))
                ).onConflictDoUpdate({
                    target: [playlists.id],
                    set: {
                        name: playlistsData[0].name,
                        canDelete: playlistsData[0].canDelete,
                        childCount: playlistsData[0].childCount ?? null,
                        metadataJson: playlistsData[0].metadataJson,
                        updatedAt: now,
                    },
                });

                totalFetched += playlistsData.length;
                offset += playlistsData.length;

                await updateSyncCursor(
                    this.sourceId,
                    entityType,
                    offset,
                    this.config.pageSize,
                    playlistsData.length < this.config.pageSize
                );

                this.reportProgress({
                    entityType,
                    totalFetched,
                    hasMore: playlistsData.length === this.config.pageSize,
                });

                hasMore = playlistsData.length === this.config.pageSize;
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
