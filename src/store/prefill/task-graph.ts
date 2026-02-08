/**
 * Prefill Task Graph
 * 
 * Manages dependent prefill tasks that require parent entities to exist first.
 * For example, album tracks require albums to be fetched first.
 */

import PQueue from 'p-queue';
import { db } from '../db/index';
import type { SourceDriver } from '../sources/types';
import { EntityType, type PrefillProgressCallback } from './orchestrator';

/**
 * Task graph configuration
 */
export interface TaskGraphConfig {
    /** Maximum number of concurrent tasks */
    concurrency?: number;
    /** Progress callback */
    onProgress?: PrefillProgressCallback;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<TaskGraphConfig, 'onProgress'>> = {
    concurrency: 5,
};

/**
 * Task graph for dependent prefill operations
 */
export class PrefillTaskGraph {
    private queue: PQueue;
    private config: Required<Omit<TaskGraphConfig, 'onProgress'>> & Pick<TaskGraphConfig, 'onProgress'>;
    private sourceId: string;
    private driver: SourceDriver;

    constructor(sourceId: string, driver: SourceDriver, config: TaskGraphConfig = {}) {
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
    private reportProgress(entityType: EntityType, totalFetched: number, hasMore: boolean, error?: Error) {
        if (this.config.onProgress) {
            this.config.onProgress({
                entityType,
                totalFetched,
                hasMore,
                error,
            });
        }
    }

    /**
     * Prefill album tracks for all albums
     * This should run after albums are prefilled
     */
    async prefillAlbumTracks(): Promise<void> {
        const entityType = EntityType.ALBUM_TRACKS;
        let totalFetched = 0;

        try {
            // Get all albums that need tracks fetched
            const albums = await db.query.albums.findMany({
                where: (albums, { eq }) => eq(albums.sourceId, this.sourceId),
            });

            // Queue up tasks to fetch tracks for each album
            const tasks = albums.map(album => 
                () => this.fetchAlbumTracks(album.id)
            );

            await Promise.all(tasks.map(task => this.queue.add(task)));

            this.reportProgress(entityType, totalFetched, false);
        } catch (error) {
            this.reportProgress(
                entityType,
                totalFetched,
                false,
                error instanceof Error ? error : new Error(String(error))
            );
            throw error;
        }
    }

    /**
     * Fetch tracks for a single album
     */
    private async fetchAlbumTracks(albumId: string): Promise<void> {
        let offset = 0;
        const limit = 500;
        let hasMore = true;

        while (hasMore) {
            const tracks = await this.driver.getTracksByAlbum(albumId, { offset, limit });
            
            if (tracks.length === 0) {
                break;
            }

            // Insert tracks into database
            // This is a placeholder - actual implementation would use proper upsert

            offset += tracks.length;
            hasMore = tracks.length === limit;
        }
    }

    /**
     * Prefill playlist tracks for all playlists
     * This should run after playlists are prefilled
     */
    async prefillPlaylistTracks(): Promise<void> {
        const entityType = EntityType.PLAYLIST_TRACKS;
        let totalFetched = 0;

        try {
            // Get all playlists that need tracks fetched
            const playlists = await db.query.playlists.findMany({
                where: (playlists, { eq }) => eq(playlists.sourceId, this.sourceId),
            });

            // Queue up tasks to fetch tracks for each playlist
            const tasks = playlists.map(playlist => 
                () => this.fetchPlaylistTracks(playlist.id)
            );

            await Promise.all(tasks.map(task => this.queue.add(task)));

            this.reportProgress(entityType, totalFetched, false);
        } catch (error) {
            this.reportProgress(
                entityType,
                totalFetched,
                false,
                error instanceof Error ? error : new Error(String(error))
            );
            throw error;
        }
    }

    /**
     * Fetch tracks for a single playlist
     */
    private async fetchPlaylistTracks(playlistId: string): Promise<void> {
        let offset = 0;
        const limit = 500;
        let hasMore = true;

        while (hasMore) {
            const tracks = await this.driver.getTracksByPlaylist(playlistId, { offset, limit });
            
            if (tracks.length === 0) {
                break;
            }

            // Insert tracks into database
            // This is a placeholder - actual implementation would use proper upsert

            offset += tracks.length;
            hasMore = tracks.length === limit;
        }
    }

    /**
     * Prefill similar albums for all albums
     * This is optional and can fail gracefully
     */
    async prefillSimilarAlbums(): Promise<void> {
        const entityType = EntityType.SIMILAR_ALBUMS;
        let totalFetched = 0;

        try {
            // Get all albums
            const albums = await db.query.albums.findMany({
                where: (albums, { eq }) => eq(albums.sourceId, this.sourceId),
                limit: 100, // Limit to avoid too many requests
            });

            // Queue up tasks to fetch similar albums
            const tasks = albums.map(album => 
                () => this.fetchSimilarAlbums(album.id).catch(() => {
                    // Silently fail for similar albums
                })
            );

            await Promise.all(tasks.map(task => this.queue.add(task)));

            this.reportProgress(entityType, totalFetched, false);
        } catch (error) {
            // Similar albums are optional, so just report but don't throw
            this.reportProgress(
                entityType,
                totalFetched,
                false,
                error instanceof Error ? error : new Error(String(error))
            );
        }
    }

    /**
     * Fetch similar albums for a single album
     */
    private async fetchSimilarAlbums(albumId: string): Promise<void> {
        await this.driver.getSimilarAlbums(albumId, { limit: 20 });
        
        // Insert similar albums into database
        // This is a placeholder - actual implementation would use proper upsert
    }

    /**
     * Prefill lyrics for tracks
     * This is optional and can fail gracefully
     */
    async prefillLyrics(): Promise<void> {
        const entityType = EntityType.LYRICS;
        let totalFetched = 0;

        try {
            // Get tracks that might have lyrics
            const tracks = await db.query.tracks.findMany({
                where: (tracks, { eq }) => eq(tracks.sourceId, this.sourceId),
                limit: 100, // Limit to avoid too many requests
            });

            // Queue up tasks to fetch lyrics
            const tasks = tracks.map(track => 
                () => this.fetchLyrics(track.id).catch(() => {
                    // Silently fail for lyrics
                })
            );

            await Promise.all(tasks.map(task => this.queue.add(task)));

            this.reportProgress(entityType, totalFetched, false);
        } catch (error) {
            // Lyrics are optional, so just report but don't throw
            this.reportProgress(
                entityType,
                totalFetched,
                false,
                error instanceof Error ? error : new Error(String(error))
            );
        }
    }

    /**
     * Fetch lyrics for a single track
     */
    private async fetchLyrics(trackId: string): Promise<void> {
        const lyrics = await this.driver.getTrackLyrics(trackId);
        
        if (lyrics) {
            // Update track with lyrics
            // This is a placeholder - actual implementation would update the track
        }
    }

    /**
     * Run all dependent tasks
     */
    async runAllTasks(): Promise<void> {
        // Run critical tasks first
        await this.prefillAlbumTracks();
        await this.prefillPlaylistTracks();

        // Run optional tasks (can fail)
        await Promise.allSettled([
            this.prefillSimilarAlbums(),
            this.prefillLyrics(),
        ]);

        await this.queue.onIdle();
    }
}

/**
 * Helper function to run task graph
 */
export async function runTaskGraph(
    sourceId: string,
    driver: SourceDriver,
    config?: TaskGraphConfig
): Promise<void> {
    const taskGraph = new PrefillTaskGraph(sourceId, driver, config);
    await taskGraph.runAllTasks();
}
