/**
 * Prefill Task Graph
 * 
 * Handles dependent prefill tasks that require parent entities to exist first:
 * - Album tracks (requires albums)
 * - Playlist tracks (requires playlists)
 * - Similar albums (requires albums)
 * - Lyrics (requires tracks)
 */

import { SourceDriver } from '../sources/types';
import {
  bulkUpsertTracks,
  upsertSyncCursor,
  getSyncCursor,
  getDatabase,
} from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { EntityType, PrefillProgress, PrefillProgressCallback } from './orchestrator';

const MAX_CONCURRENT_REQUESTS = 5;
const PAGE_SIZE = 500;
const MAX_RETRIES = 5;

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
 * Task graph for dependent prefill operations
 */
export class PrefillTaskGraph {
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
   * Prefill tracks for all albums
   */
  async prefillAlbumTracks(): Promise<void> {
    const entityType: EntityType = 'album_tracks';
    let cursor = await getSyncCursor(this.sourceId, entityType);
    
    if (cursor?.completed) {
      console.log(`Album tracks already prefilled for source ${this.sourceId}`);
      return;
    }

    const db = getDatabase();
    
    // Get all albums for this source
    const albums = await db
      .select()
      .from(schema.albums)
      .where(eq(schema.albums.sourceId, this.sourceId));

    let processedCount = cursor?.startIndex || 0;
    let totalFetched = 0;

    for (let i = processedCount; i < albums.length; i++) {
      const album = albums[i];
      
      await this.waitForSlot();
      this.activeRequests++;

      try {
        // Fetch all tracks for this album (with paging)
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const tracks = await withRetry(() =>
            this.driver.getTracksByAlbum(album.id, { offset, limit: PAGE_SIZE })
          );

          if (tracks.length === 0) {
            hasMore = false;
          } else {
            // Transform and upsert tracks
            const trackRecords = tracks.map(track => ({
              sourceId: this.sourceId,
              id: track.id,
              name: track.name,
              albumId: track.albumId || album.id,
              album: track.album || album.name,
              albumArtist: track.albumArtist || album.albumArtist,
              productionYear: track.productionYear,
              indexNumber: track.indexNumber,
              parentIndexNumber: track.parentIndexNumber,
              hasLyrics: false, // Will be updated by lyrics prefill
              runTimeTicks: track.runTimeTicks,
              metadataJson: JSON.stringify(track),
            }));

            await bulkUpsertTracks(trackRecords);

            // Insert track-artist relations
            for (const track of tracks) {
              if (track.artistItems && track.artistItems.length > 0) {
                for (let j = 0; j < track.artistItems.length; j++) {
                  const artist = track.artistItems[j];
                  await db.insert(schema.trackArtists)
                    .values({
                      sourceId: this.sourceId,
                      trackId: track.id,
                      artistId: artist.id,
                      orderIndex: j,
                    })
                    .onConflictDoNothing();
                }
              }
            }

            totalFetched += tracks.length;
            offset += tracks.length;

            if (tracks.length < PAGE_SIZE) {
              hasMore = false;
            }
          }
        }

        processedCount = i + 1;

        // Update cursor periodically
        if (processedCount % 10 === 0) {
          await upsertSyncCursor({
            sourceId: this.sourceId,
            entityType,
            startIndex: processedCount,
            pageSize: PAGE_SIZE,
            completed: false,
          });

          this.reportProgress({
            sourceId: this.sourceId,
            entityType,
            startIndex: processedCount,
            pageSize: PAGE_SIZE,
            completed: false,
            totalFetched,
          });
        }
      } catch (error) {
        console.error(`Error prefilling tracks for album ${album.id}:`, error);
        this.reportProgress({
          sourceId: this.sourceId,
          entityType,
          startIndex: processedCount,
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
      startIndex: processedCount,
      pageSize: PAGE_SIZE,
      completed: true,
    });

    this.reportProgress({
      sourceId: this.sourceId,
      entityType,
      startIndex: processedCount,
      pageSize: PAGE_SIZE,
      completed: true,
      totalFetched,
    });
  }

  /**
   * Prefill tracks for all playlists
   */
  async prefillPlaylistTracks(): Promise<void> {
    const entityType: EntityType = 'playlist_tracks';
    let cursor = await getSyncCursor(this.sourceId, entityType);
    
    if (cursor?.completed) {
      console.log(`Playlist tracks already prefilled for source ${this.sourceId}`);
      return;
    }

    const db = getDatabase();
    
    // Get all playlists for this source
    const playlists = await db
      .select()
      .from(schema.playlists)
      .where(eq(schema.playlists.sourceId, this.sourceId));

    let processedCount = cursor?.startIndex || 0;
    let totalFetched = 0;

    for (let i = processedCount; i < playlists.length; i++) {
      const playlist = playlists[i];
      
      await this.waitForSlot();
      this.activeRequests++;

      try {
        // Fetch all tracks for this playlist (with paging)
        let offset = 0;
        let hasMore = true;
        let position = 0;

        while (hasMore) {
          const tracks = await withRetry(() =>
            this.driver.getTracksByPlaylist(playlist.id, { offset, limit: PAGE_SIZE })
          );

          if (tracks.length === 0) {
            hasMore = false;
          } else {
            // Upsert tracks if they don't exist
            const trackRecords = tracks.map(track => ({
              sourceId: this.sourceId,
              id: track.id,
              name: track.name,
              albumId: track.albumId,
              album: track.album,
              albumArtist: track.albumArtist,
              productionYear: track.productionYear,
              indexNumber: track.indexNumber,
              parentIndexNumber: track.parentIndexNumber,
              hasLyrics: false,
              runTimeTicks: track.runTimeTicks,
              metadataJson: JSON.stringify(track),
            }));

            await bulkUpsertTracks(trackRecords);

            // Insert playlist-track relations
            for (const track of tracks) {
              await db.insert(schema.playlistTracks)
                .values({
                  sourceId: this.sourceId,
                  playlistId: playlist.id,
                  trackId: track.id,
                  position: position++,
                })
                .onConflictDoNothing();
            }

            totalFetched += tracks.length;
            offset += tracks.length;

            if (tracks.length < PAGE_SIZE) {
              hasMore = false;
            }
          }
        }

        processedCount = i + 1;

        // Update cursor periodically
        if (processedCount % 10 === 0) {
          await upsertSyncCursor({
            sourceId: this.sourceId,
            entityType,
            startIndex: processedCount,
            pageSize: PAGE_SIZE,
            completed: false,
          });

          this.reportProgress({
            sourceId: this.sourceId,
            entityType,
            startIndex: processedCount,
            pageSize: PAGE_SIZE,
            completed: false,
            totalFetched,
          });
        }
      } catch (error) {
        console.error(`Error prefilling tracks for playlist ${playlist.id}:`, error);
        this.reportProgress({
          sourceId: this.sourceId,
          entityType,
          startIndex: processedCount,
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
      startIndex: processedCount,
      pageSize: PAGE_SIZE,
      completed: true,
    });

    this.reportProgress({
      sourceId: this.sourceId,
      entityType,
      startIndex: processedCount,
      pageSize: PAGE_SIZE,
      completed: true,
      totalFetched,
    });
  }

  /**
   * Prefill similar albums for all albums
   */
  async prefillSimilarAlbums(): Promise<void> {
    const entityType: EntityType = 'similar_albums';
    let cursor = await getSyncCursor(this.sourceId, entityType);
    
    if (cursor?.completed) {
      console.log(`Similar albums already prefilled for source ${this.sourceId}`);
      return;
    }

    const db = getDatabase();
    
    // Get all albums for this source
    const albums = await db
      .select()
      .from(schema.albums)
      .where(eq(schema.albums.sourceId, this.sourceId));

    let processedCount = cursor?.startIndex || 0;
    let totalFetched = 0;

    for (let i = processedCount; i < albums.length; i++) {
      const album = albums[i];
      
      await this.waitForSlot();
      this.activeRequests++;

      try {
        const similarAlbums = await withRetry(() =>
          this.driver.getSimilarAlbums(album.id, { limit: 12 })
        );

        // Insert similar album relations
        for (const similarAlbum of similarAlbums) {
          await db.insert(schema.albumSimilar)
            .values({
              sourceId: this.sourceId,
              albumId: album.id,
              similarAlbumId: similarAlbum.id,
            })
            .onConflictDoNothing();
        }

        totalFetched += similarAlbums.length;
        processedCount = i + 1;

        // Update cursor periodically
        if (processedCount % 50 === 0) {
          await upsertSyncCursor({
            sourceId: this.sourceId,
            entityType,
            startIndex: processedCount,
            pageSize: PAGE_SIZE,
            completed: false,
          });

          this.reportProgress({
            sourceId: this.sourceId,
            entityType,
            startIndex: processedCount,
            pageSize: PAGE_SIZE,
            completed: false,
            totalFetched,
          });
        }
      } catch (error) {
        // Don't fail the entire process if similar albums fail for one album
        console.warn(`Error prefilling similar albums for ${album.id}:`, error);
      } finally {
        this.activeRequests--;
      }
    }

    // Mark as completed
    await upsertSyncCursor({
      sourceId: this.sourceId,
      entityType,
      startIndex: processedCount,
      pageSize: PAGE_SIZE,
      completed: true,
    });

    this.reportProgress({
      sourceId: this.sourceId,
      entityType,
      startIndex: processedCount,
      pageSize: PAGE_SIZE,
      completed: true,
      totalFetched,
    });
  }

  /**
   * Prefill lyrics for all tracks
   */
  async prefillLyrics(): Promise<void> {
    const entityType: EntityType = 'lyrics';
    let cursor = await getSyncCursor(this.sourceId, entityType);
    
    if (cursor?.completed) {
      console.log(`Lyrics already prefilled for source ${this.sourceId}`);
      return;
    }

    const db = getDatabase();
    
    // Get all tracks for this source
    const tracks = await db
      .select()
      .from(schema.tracks)
      .where(eq(schema.tracks.sourceId, this.sourceId));

    let processedCount = cursor?.startIndex || 0;
    let totalFetched = 0;

    for (let i = processedCount; i < tracks.length; i++) {
      const track = tracks[i];
      
      await this.waitForSlot();
      this.activeRequests++;

      try {
        const lyrics = await withRetry(() =>
          this.driver.getTrackLyrics(track.id)
        );

        if (lyrics) {
          // Update track with lyrics
          await db.update(schema.tracks)
            .set({
              hasLyrics: true,
              lyrics: lyrics.lyrics,
              updatedAt: Date.now(),
            })
            .where(eq(schema.tracks.id, track.id));
          
          totalFetched++;
        }

        processedCount = i + 1;

        // Update cursor periodically
        if (processedCount % 100 === 0) {
          await upsertSyncCursor({
            sourceId: this.sourceId,
            entityType,
            startIndex: processedCount,
            pageSize: PAGE_SIZE,
            completed: false,
          });

          this.reportProgress({
            sourceId: this.sourceId,
            entityType,
            startIndex: processedCount,
            pageSize: PAGE_SIZE,
            completed: false,
            totalFetched,
          });
        }
      } catch (error) {
        // Don't fail the entire process if lyrics fail for one track
        console.warn(`Error prefilling lyrics for track ${track.id}:`, error);
      } finally {
        this.activeRequests--;
      }
    }

    // Mark as completed
    await upsertSyncCursor({
      sourceId: this.sourceId,
      entityType,
      startIndex: processedCount,
      pageSize: PAGE_SIZE,
      completed: true,
    });

    this.reportProgress({
      sourceId: this.sourceId,
      entityType,
      startIndex: processedCount,
      pageSize: PAGE_SIZE,
      completed: true,
      totalFetched,
    });
  }

  /**
   * Run all dependent tasks
   */
  async runAll(): Promise<void> {
    try {
      // Phase 1: Album and playlist tracks (can run concurrently)
      await Promise.all([
        this.prefillAlbumTracks(),
        this.prefillPlaylistTracks(),
      ]);

      // Phase 2: Similar albums and lyrics (can run concurrently)
      await Promise.all([
        this.prefillSimilarAlbums(),
        this.prefillLyrics(),
      ]);

      console.log(`Task graph completed for source ${this.sourceId}`);
    } catch (error) {
      console.error(`Task graph failed for source ${this.sourceId}:`, error);
      throw error;
    }
  }
}
