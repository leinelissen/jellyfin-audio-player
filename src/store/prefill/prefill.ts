/**
 * Unified Prefill System
 * 
 * Manages automated data synchronization from media sources to local database.
 * Uses p-queue for bounded concurrency with recursive task spawning for pagination.
 * Handles both basic entities (artists, albums, playlists) and dependent entities
 * (album tracks, playlist tracks, similar albums, lyrics).
 */

import PQueue from 'p-queue';
import { eq, and } from 'drizzle-orm';

import { db } from '@/store/db';
import type { SourceDriver } from '@/store/sources/types';
import syncCursors from '@/store/sync-cursors/entity';
import artists from '@/store/artists/entity';
import albums from '@/store/albums/entity';
import playlists from '@/store/playlists/entity';
import tracks from '@/store/tracks/entity';
import playlistTracks from '@/store/playlist-tracks/entity';
import albumSimilar from '@/store/album-similar/entity';

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
 * Progress information for a single entity type
 */
export interface EntityProgress {
    entityType: EntityType;
    totalFetched: number;
    totalInserted: number;
    currentPage: number;
    isComplete: boolean;
    error?: Error;
}

/**
 * Overall prefill progress
 */
export interface PrefillProgress {
    entities: Record<EntityType, EntityProgress>;
    queueSize: number;
    pendingTasks: number;
}

export type PrefillProgressCallback = (progress: PrefillProgress) => void;

/**
 * Prefill configuration
 */
export interface PrefillConfig {
    /** Maximum concurrent requests */
    concurrency?: number;
    /** Page size for pagination */
    pageSize?: number;
    /** Progress callback */
    onProgress?: PrefillProgressCallback;
    /** Whether to fetch dependent entities */
    includeDependents?: boolean;
}

const DEFAULT_CONFIG: Required<Omit<PrefillConfig, 'onProgress'>> = {
    concurrency: 5,
    pageSize: 500,
    includeDependents: true,
};

/**
 * Unified Prefill Manager
 * Uses recursive task spawning for pagination with p-queue for concurrency control
 */
export class PrefillManager {
    private queue: PQueue;
    private config: Required<Omit<PrefillConfig, 'onProgress'>> & Pick<PrefillConfig, 'onProgress'>;
    private sourceId: string;
    private driver: SourceDriver;
    private progress: Record<EntityType, EntityProgress>;

    constructor(sourceId: string, driver: SourceDriver, config: PrefillConfig = {}) {
        this.sourceId = sourceId;
        this.driver = driver;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        };
        this.queue = new PQueue({ concurrency: this.config.concurrency });
        
        // Initialize progress tracking
        this.progress = {} as Record<EntityType, EntityProgress>;
        Object.values(EntityType).forEach(type => {
            this.progress[type] = {
                entityType: type,
                totalFetched: 0,
                totalInserted: 0,
                currentPage: 0,
                isComplete: false,
            };
        });
    }

    /**
     * Report current progress
     */
    private reportProgress() {
        if (this.config.onProgress) {
            this.config.onProgress({
                entities: { ...this.progress },
                queueSize: this.queue.size,
                pendingTasks: this.queue.pending,
            });
        }
    }

    /**
     * Update progress for an entity
     */
    private updateProgress(entityType: EntityType, update: Partial<EntityProgress>) {
        this.progress[entityType] = {
            ...this.progress[entityType],
            ...update,
        };
        this.reportProgress();
    }

    /**
     * Get sync cursor for resuming prefill
     */
    private async getSyncCursor(entityType: EntityType): Promise<number> {
        const cursor = await db
            .select()
            .from(syncCursors)
            .where(
                and(
                    eq(syncCursors.sourceId, this.sourceId),
                    eq(syncCursors.entityType, entityType)
                )
            )
            .limit(1);

        return cursor[0]?.startIndex || 0;
    }

    /**
     * Update sync cursor
     */
    private async updateSyncCursor(
        entityType: EntityType,
        startIndex: number,
        completed: boolean
    ) {
        const now = Date.now();
        
        await db
            .insert(syncCursors)
            .values({
                sourceId: this.sourceId,
                entityType,
                startIndex,
                pageSize: this.config.pageSize,
                completed,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: [syncCursors.sourceId, syncCursors.entityType],
                set: {
                    startIndex,
                    pageSize: this.config.pageSize,
                    completed,
                    updatedAt: now,
                },
            });
    }

    /**
     * Recursively fetch and store artists (one page at a time)
     */
    private async fetchArtistsPage(offset: number): Promise<void> {
        const entityType = EntityType.ARTISTS;
        
        try {
            const artistsData = await this.driver.getArtists({
                offset,
                limit: this.config.pageSize,
            });

            if (artistsData.length === 0) {
                this.updateProgress(entityType, { isComplete: true });
                await this.updateSyncCursor(entityType, offset, true);
                return;
            }

            // Insert artists
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

            const newOffset = offset + artistsData.length;
            this.updateProgress(entityType, {
                totalFetched: this.progress[entityType].totalFetched + artistsData.length,
                totalInserted: this.progress[entityType].totalInserted + artistsData.length,
                currentPage: Math.floor(newOffset / this.config.pageSize),
            });

            await this.updateSyncCursor(entityType, newOffset, false);

            // If we got a full page, recursively spawn the next page fetch
            if (artistsData.length === this.config.pageSize) {
                this.queue.add(() => this.fetchArtistsPage(newOffset));
            } else {
                this.updateProgress(entityType, { isComplete: true });
                await this.updateSyncCursor(entityType, newOffset, true);
            }
        } catch (error) {
            this.updateProgress(entityType, {
                error: error instanceof Error ? error : new Error(String(error)),
                isComplete: true,
            });
            throw error;
        }
    }

    /**
     * Recursively fetch and store albums (one page at a time)
     */
    private async fetchAlbumsPage(offset: number): Promise<void> {
        const entityType = EntityType.ALBUMS;
        
        try {
            const albumsData = await this.driver.getAlbums({
                offset,
                limit: this.config.pageSize,
            });

            if (albumsData.length === 0) {
                this.updateProgress(entityType, { isComplete: true });
                await this.updateSyncCursor(entityType, offset, true);
                return;
            }

            // Insert albums
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

            const newOffset = offset + albumsData.length;
            this.updateProgress(entityType, {
                totalFetched: this.progress[entityType].totalFetched + albumsData.length,
                totalInserted: this.progress[entityType].totalInserted + albumsData.length,
                currentPage: Math.floor(newOffset / this.config.pageSize),
            });

            await this.updateSyncCursor(entityType, newOffset, false);

            // If we got a full page, recursively spawn the next page fetch
            if (albumsData.length === this.config.pageSize) {
                this.queue.add(() => this.fetchAlbumsPage(newOffset));
            } else {
                this.updateProgress(entityType, { isComplete: true });
                await this.updateSyncCursor(entityType, newOffset, true);
            }
        } catch (error) {
            this.updateProgress(entityType, {
                error: error instanceof Error ? error : new Error(String(error)),
                isComplete: true,
            });
            throw error;
        }
    }

    /**
     * Recursively fetch and store playlists (one page at a time)
     */
    private async fetchPlaylistsPage(offset: number): Promise<void> {
        const entityType = EntityType.PLAYLISTS;
        
        try {
            const playlistsData = await this.driver.getPlaylists({
                offset,
                limit: this.config.pageSize,
            });

            if (playlistsData.length === 0) {
                this.updateProgress(entityType, { isComplete: true });
                await this.updateSyncCursor(entityType, offset, true);
                return;
            }

            // Insert playlists
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

            const newOffset = offset + playlistsData.length;
            this.updateProgress(entityType, {
                totalFetched: this.progress[entityType].totalFetched + playlistsData.length,
                totalInserted: this.progress[entityType].totalInserted + playlistsData.length,
                currentPage: Math.floor(newOffset / this.config.pageSize),
            });

            await this.updateSyncCursor(entityType, newOffset, false);

            // If we got a full page, recursively spawn the next page fetch
            if (playlistsData.length === this.config.pageSize) {
                this.queue.add(() => this.fetchPlaylistsPage(newOffset));
            } else {
                this.updateProgress(entityType, { isComplete: true });
                await this.updateSyncCursor(entityType, newOffset, true);
            }
        } catch (error) {
            this.updateProgress(entityType, {
                error: error instanceof Error ? error : new Error(String(error)),
                isComplete: true,
            });
            throw error;
        }
    }

    /**
     * Fetch tracks for a single album (with pagination)
     */
    private async fetchAlbumTracksPage(albumId: string, offset: number): Promise<void> {
        const entityType = EntityType.ALBUM_TRACKS;
        
        try {
            const tracksData = await this.driver.getTracksByAlbum(albumId, {
                offset,
                limit: this.config.pageSize,
            });

            if (tracksData.length === 0) {
                return;
            }

            // Insert tracks
            const now = Date.now();
            await db.insert(tracks).values(
                tracksData.map(track => ({
                    sourceId: this.sourceId,
                    id: track.id,
                    name: track.name,
                    albumId: track.albumId ?? null,
                    indexNumber: track.indexNumber ?? null,
                    parentIndexNumber: track.parentIndexNumber ?? null,
                    productionYear: track.productionYear ?? null,
                    runTimeTicks: track.runTimeTicks ?? null,
                    dateCreated: track.dateCreated ?? null,
                    lastRefreshed: null,
                    metadataJson: track.metadataJson,
                    createdAt: now,
                    updatedAt: now,
                }))
            ).onConflictDoUpdate({
                target: [tracks.id],
                set: {
                    name: tracksData[0].name,
                    albumId: tracksData[0].albumId ?? null,
                    indexNumber: tracksData[0].indexNumber ?? null,
                    parentIndexNumber: tracksData[0].parentIndexNumber ?? null,
                    productionYear: tracksData[0].productionYear ?? null,
                    runTimeTicks: tracksData[0].runTimeTicks ?? null,
                    dateCreated: tracksData[0].dateCreated ?? null,
                    metadataJson: tracksData[0].metadataJson,
                    updatedAt: now,
                },
            });

            this.updateProgress(entityType, {
                totalFetched: this.progress[entityType].totalFetched + tracksData.length,
                totalInserted: this.progress[entityType].totalInserted + tracksData.length,
            });


            // Recursively fetch next page if this was a full page
            if (tracksData.length === this.config.pageSize) {
                this.queue.add(() => this.fetchAlbumTracksPage(albumId, offset + this.config.pageSize));
            }
        } catch (error) {
            // Don't throw - just log and continue with other albums
            console.error(`Error fetching tracks for album ${albumId}:`, error);
        }
    }

    /**
     * Fetch tracks for a single playlist (with pagination)
     */
    private async fetchPlaylistTracksPage(playlistId: string, offset: number): Promise<void> {
        const entityType = EntityType.PLAYLIST_TRACKS;
        
        try {
            const tracksData = await this.driver.getTracksByPlaylist(playlistId, {
                offset,
                limit: this.config.pageSize,
            });

            if (tracksData.length === 0) {
                return;
            }

            // Insert tracks first
            const now = Date.now();
            await db.insert(tracks).values(
                tracksData.map(track => ({
                    sourceId: this.sourceId,
                    id: track.id,
                    name: track.name,
                    albumId: track.albumId ?? null,
                    indexNumber: track.indexNumber ?? null,
                    parentIndexNumber: track.parentIndexNumber ?? null,
                    productionYear: track.productionYear ?? null,
                    runTimeTicks: track.runTimeTicks ?? null,
                    dateCreated: track.dateCreated ?? null,
                    lastRefreshed: null,
                    metadataJson: track.metadataJson,
                    createdAt: now,
                    updatedAt: now,
                }))
            ).onConflictDoUpdate({
                target: [tracks.id],
                set: {
                    name: tracksData[0].name,
                    albumId: tracksData[0].albumId ?? null,
                    indexNumber: tracksData[0].indexNumber ?? null,
                    parentIndexNumber: tracksData[0].parentIndexNumber ?? null,
                    productionYear: tracksData[0].productionYear ?? null,
                    runTimeTicks: tracksData[0].runTimeTicks ?? null,
                    dateCreated: tracksData[0].dateCreated ?? null,
                    metadataJson: tracksData[0].metadataJson,
                    updatedAt: now,
                },
            });

            // Insert playlist-track relationships
            await db.insert(playlistTracks).values(
                tracksData.map((track, index) => ({
                    playlistId,
                    trackId: track.id,
                    position: offset + index,
                    createdAt: now,
                }))
            ).onConflictDoUpdate({
                target: [playlistTracks.playlistId, playlistTracks.trackId],
                set: {
                    position: offset,
                },
            });

            this.updateProgress(entityType, {
                totalFetched: this.progress[entityType].totalFetched + tracksData.length,
                totalInserted: this.progress[entityType].totalInserted + tracksData.length,
            });


            // Recursively fetch next page if this was a full page
            if (tracksData.length === this.config.pageSize) {
                this.queue.add(() => this.fetchPlaylistTracksPage(playlistId, offset + this.config.pageSize));
            }
        } catch (error) {
            // Don't throw - just log and continue with other playlists
            console.error(`Error fetching tracks for playlist ${playlistId}:`, error);
        }
    }

    /**
     * Fetch similar albums for a single album
     */
    private async fetchSimilarAlbums(albumId: string): Promise<void> {
        try {
            const similarAlbums = await this.driver.getSimilarAlbums(albumId, { limit: 20 });

            if (similarAlbums.length === 0) {
                return;
            }

            // Insert similar album relationships
            const now = Date.now();
            await db.insert(albumSimilar).values(
                similarAlbums.map((similarAlbum, index) => ({
                    albumId,
                    similarAlbumId: similarAlbum.id,
                    rank: index,
                    createdAt: now,
                }))
            ).onConflictDoUpdate({
                target: [albumSimilar.albumId, albumSimilar.similarAlbumId],
                set: {
                    rank: 0,
                },
            });

            this.updateProgress(EntityType.SIMILAR_ALBUMS, {
                totalFetched: this.progress[EntityType.SIMILAR_ALBUMS].totalFetched + similarAlbums.length,
                totalInserted: this.progress[EntityType.SIMILAR_ALBUMS].totalInserted + similarAlbums.length,
            });

        } catch (error) {
            // Similar albums are optional, silently fail
            console.debug(`Could not fetch similar albums for ${albumId}:`, error);
        }
    }

    /**
     * Prefill basic entities (artists, albums, playlists)
     */
    async prefillBasicEntities(): Promise<void> {
        // Get starting offsets from cursors
        const artistsOffset = await this.getSyncCursor(EntityType.ARTISTS);
        const albumsOffset = await this.getSyncCursor(EntityType.ALBUMS);
        const playlistsOffset = await this.getSyncCursor(EntityType.PLAYLISTS);

        // Queue initial page fetches for each entity type
        // These will recursively spawn more tasks as needed
        this.queue.add(() => this.fetchArtistsPage(artistsOffset));
        this.queue.add(() => this.fetchAlbumsPage(albumsOffset));
        this.queue.add(() => this.fetchPlaylistsPage(playlistsOffset));

        await this.queue.onIdle();
    }

    /**
     * Prefill dependent entities (album tracks, playlist tracks, etc.)
     */
    async prefillDependentEntities(): Promise<void> {
        // Wait for basic entities to complete first
        await this.queue.onIdle();

        // Fetch all albums and spawn track fetch tasks
        const albumsList = await db.query.albums.findMany({
            where: (albums, { eq }) => eq(albums.sourceId, this.sourceId),
        });

        albumsList.forEach(album => {
            this.queue.add(() => this.fetchAlbumTracksPage(album.id, 0));
        });

        // Fetch all playlists and spawn track fetch tasks
        const playlistsList = await db.query.playlists.findMany({
            where: (playlists, { eq }) => eq(playlists.sourceId, this.sourceId),
        });

        playlistsList.forEach(playlist => {
            this.queue.add(() => this.fetchPlaylistTracksPage(playlist.id, 0));
        });

        await this.queue.onIdle();

        // Optional: Fetch similar albums (limit to first 100 albums)
        const albumsForSimilar = albumsList.slice(0, 100);
        albumsForSimilar.forEach(album => {
            this.queue.add(() => this.fetchSimilarAlbums(album.id));
        });

        await this.queue.onIdle();
        
        this.updateProgress(EntityType.ALBUM_TRACKS, { isComplete: true });
        this.updateProgress(EntityType.PLAYLIST_TRACKS, { isComplete: true });
        this.updateProgress(EntityType.SIMILAR_ALBUMS, { isComplete: true });
    }

    /**
     * Run complete prefill process
     */
    async runPrefill(): Promise<void> {
        // Prefill basic entities first
        await this.prefillBasicEntities();

        // Then prefill dependent entities if configured
        if (this.config.includeDependents) {
            await this.prefillDependentEntities();
        }

        // Final progress report
        this.reportProgress();
    }

    /**
     * Get current progress
     */
    getProgress(): PrefillProgress {
        return {
            entities: { ...this.progress },
            queueSize: this.queue.size,
            pendingTasks: this.queue.pending,
        };
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
    const manager = new PrefillManager(sourceId, driver, config);
    await manager.runPrefill();
}
