/**
 * Prefill Orchestrator
 * 
 * Coordinates the prefilling of SQLite database from source servers.
 * Features:
 * - Bounded concurrency (max 5 requests)
 * - Page size: 500
 * - Cursor-based resume support
 * - Error handling with retry (up to 5 times)
 */

import { SourceDriver } from '../sources/types';
import {
  bulkUpsertArtists,
  bulkUpsertAlbums,
  bulkUpsertTracks,
  bulkUpsertPlaylists,
  upsertSyncCursor,
  getSyncCursor,
  getDatabase,
} from '../db';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';

const MAX_CONCURRENT_REQUESTS = 5;
const PAGE_SIZE = 500;
const MAX_RETRIES = 5;

export type EntityType = 
  | 'artists'
  | 'albums'
  | 'tracks'
  | 'playlists'
  | 'album_tracks'
  | 'playlist_tracks'
  | 'similar_albums'
  | 'lyrics';

export interface PrefillProgress {
  sourceId: string;
  entityType: EntityType;
  startIndex: number;
  pageSize: number;
  completed: boolean;
  totalFetched: number;
  error?: string;
}

export type PrefillProgressCallback = (progress: PrefillProgress) => void;

/**
 * Retry wrapper for API calls
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} failed:`, error);
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries: ${lastError?.message}`);
}

/**
 * Prefill orchestrator for a single source
 */
export class PrefillOrchestrator {
  private sourceId: string;
  private driver: SourceDriver;
  private onProgress?: PrefillProgressCallback;
  private activeRequests: number = 0;

  constructor(
    sourceId: string,
    driver: SourceDriver,
    onProgress?: PrefillProgressCallback
  ) {
    this.sourceId = sourceId;
    this.driver = driver;
    this.onProgress = onProgress;
  }

  /**
   * Report progress
   */
  private reportProgress(progress: PrefillProgress) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /**
   * Wait for available request slot (bounded concurrency)
   */
  private async waitForSlot(): Promise<void> {
    while (this.activeRequests >= MAX_CONCURRENT_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Prefill artists
   */
  async prefillArtists(): Promise<void> {
    const entityType: EntityType = 'artists';
    let cursor = await getSyncCursor(this.sourceId, entityType);
    
    if (cursor?.completed) {
      console.log(`Artists already prefilled for source ${this.sourceId}`);
      return;
    }

    let startIndex = cursor?.startIndex || 0;
    let totalFetched = 0;
    let hasMore = true;

    while (hasMore) {
      await this.waitForSlot();
      this.activeRequests++;

      try {
        const artists = await withRetry(() =>
          this.driver.getArtists({ offset: startIndex, limit: PAGE_SIZE })
        );

        if (artists.length === 0) {
          hasMore = false;
        } else {
          // Transform and upsert artists
          const artistRecords = artists.map(artist => ({
            sourceId: this.sourceId,
            id: artist.id,
            name: artist.name,
            isFolder: artist.isFolder,
            metadataJson: JSON.stringify(artist),
          }));

          await bulkUpsertArtists(artistRecords);

          startIndex += artists.length;
          totalFetched += artists.length;

          // Update cursor
          await upsertSyncCursor({
            sourceId: this.sourceId,
            entityType,
            startIndex,
            pageSize: PAGE_SIZE,
            completed: artists.length < PAGE_SIZE,
          });

          this.reportProgress({
            sourceId: this.sourceId,
            entityType,
            startIndex,
            pageSize: PAGE_SIZE,
            completed: false,
            totalFetched,
          });

          if (artists.length < PAGE_SIZE) {
            hasMore = false;
          }
        }
      } catch (error) {
        console.error(`Error prefilling artists:`, error);
        this.reportProgress({
          sourceId: this.sourceId,
          entityType,
          startIndex,
          pageSize: PAGE_SIZE,
          completed: false,
          totalFetched,
          error: (error as Error).message,
        });
        throw error;
      } finally {
        this.activeRequests--;
      }
    }

    // Mark as completed
    await upsertSyncCursor({
      sourceId: this.sourceId,
      entityType,
      startIndex,
      pageSize: PAGE_SIZE,
      completed: true,
    });

    this.reportProgress({
      sourceId: this.sourceId,
      entityType,
      startIndex,
      pageSize: PAGE_SIZE,
      completed: true,
      totalFetched,
    });
  }

  /**
   * Prefill albums
   */
  async prefillAlbums(): Promise<void> {
    const entityType: EntityType = 'albums';
    let cursor = await getSyncCursor(this.sourceId, entityType);
    
    if (cursor?.completed) {
      console.log(`Albums already prefilled for source ${this.sourceId}`);
      return;
    }

    let startIndex = cursor?.startIndex || 0;
    let totalFetched = 0;
    let hasMore = true;

    while (hasMore) {
      await this.waitForSlot();
      this.activeRequests++;

      try {
        const albums = await withRetry(() =>
          this.driver.getAlbums({ offset: startIndex, limit: PAGE_SIZE })
        );

        if (albums.length === 0) {
          hasMore = false;
        } else {
          // Transform and upsert albums
          const albumRecords = albums.map(album => ({
            sourceId: this.sourceId,
            id: album.id,
            name: album.name,
            productionYear: album.productionYear,
            isFolder: album.isFolder,
            albumArtist: album.albumArtist,
            dateCreated: album.dateCreated,
            lastRefreshed: Date.now(),
            metadataJson: JSON.stringify(album),
          }));

          await bulkUpsertAlbums(albumRecords);

          // Also insert album-artist relations
          const db = getDatabase();
          for (const album of albums) {
            if (album.artistItems && album.artistItems.length > 0) {
              for (let i = 0; i < album.artistItems.length; i++) {
                const artist = album.artistItems[i];
                await db.insert(schema.albumArtists)
                  .values({
                    sourceId: this.sourceId,
                    albumId: album.id,
                    artistId: artist.id,
                    orderIndex: i,
                  })
                  .onConflictDoNothing();
              }
            }
          }

          startIndex += albums.length;
          totalFetched += albums.length;

          // Update cursor
          await upsertSyncCursor({
            sourceId: this.sourceId,
            entityType,
            startIndex,
            pageSize: PAGE_SIZE,
            completed: albums.length < PAGE_SIZE,
          });

          this.reportProgress({
            sourceId: this.sourceId,
            entityType,
            startIndex,
            pageSize: PAGE_SIZE,
            completed: false,
            totalFetched,
          });

          if (albums.length < PAGE_SIZE) {
            hasMore = false;
          }
        }
      } catch (error) {
        console.error(`Error prefilling albums:`, error);
        this.reportProgress({
          sourceId: this.sourceId,
          entityType,
          startIndex,
          pageSize: PAGE_SIZE,
          completed: false,
          totalFetched,
          error: (error as Error).message,
        });
        throw error;
      } finally {
        this.activeRequests--;
      }
    }

    // Mark as completed
    await upsertSyncCursor({
      sourceId: this.sourceId,
      entityType,
      startIndex,
      pageSize: PAGE_SIZE,
      completed: true,
    });

    this.reportProgress({
      sourceId: this.sourceId,
      entityType,
      startIndex,
      pageSize: PAGE_SIZE,
      completed: true,
      totalFetched,
    });
  }

  /**
   * Prefill playlists
   */
  async prefillPlaylists(): Promise<void> {
    const entityType: EntityType = 'playlists';
    let cursor = await getSyncCursor(this.sourceId, entityType);
    
    if (cursor?.completed) {
      console.log(`Playlists already prefilled for source ${this.sourceId}`);
      return;
    }

    let startIndex = cursor?.startIndex || 0;
    let totalFetched = 0;
    let hasMore = true;

    while (hasMore) {
      await this.waitForSlot();
      this.activeRequests++;

      try {
        const playlists = await withRetry(() =>
          this.driver.getPlaylists({ offset: startIndex, limit: PAGE_SIZE })
        );

        if (playlists.length === 0) {
          hasMore = false;
        } else {
          // Transform and upsert playlists
          const playlistRecords = playlists.map(playlist => ({
            sourceId: this.sourceId,
            id: playlist.id,
            name: playlist.name,
            canDelete: playlist.canDelete,
            childCount: playlist.childCount,
            lastRefreshed: Date.now(),
            metadataJson: JSON.stringify(playlist),
          }));

          await bulkUpsertPlaylists(playlistRecords);

          startIndex += playlists.length;
          totalFetched += playlists.length;

          // Update cursor
          await upsertSyncCursor({
            sourceId: this.sourceId,
            entityType,
            startIndex,
            pageSize: PAGE_SIZE,
            completed: playlists.length < PAGE_SIZE,
          });

          this.reportProgress({
            sourceId: this.sourceId,
            entityType,
            startIndex,
            pageSize: PAGE_SIZE,
            completed: false,
            totalFetched,
          });

          if (playlists.length < PAGE_SIZE) {
            hasMore = false;
          }
        }
      } catch (error) {
        console.error(`Error prefilling playlists:`, error);
        this.reportProgress({
          sourceId: this.sourceId,
          entityType,
          startIndex,
          pageSize: PAGE_SIZE,
          completed: false,
          totalFetched,
          error: (error as Error).message,
        });
        throw error;
      } finally {
        this.activeRequests--;
      }
    }

    // Mark as completed
    await upsertSyncCursor({
      sourceId: this.sourceId,
      entityType,
      startIndex,
      pageSize: PAGE_SIZE,
      completed: true,
    });

    this.reportProgress({
      sourceId: this.sourceId,
      entityType,
      startIndex,
      pageSize: PAGE_SIZE,
      completed: true,
      totalFetched,
    });
  }

  /**
   * Prefill all entities in order
   */
  async prefillAll(): Promise<void> {
    try {
      // Phase 1: Artists and Albums (can run concurrently)
      await Promise.all([
        this.prefillArtists(),
        this.prefillAlbums(),
      ]);

      // Phase 2: Playlists
      await this.prefillPlaylists();

      console.log(`Prefill completed for source ${this.sourceId}`);
    } catch (error) {
      console.error(`Prefill failed for source ${this.sourceId}:`, error);
      throw error;
    }
  }
}
