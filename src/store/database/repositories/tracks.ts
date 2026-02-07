import { eq, like, desc, asc } from 'drizzle-orm';
import { getDatabase } from '../connection';
import { tracks, Track, NewTrack } from '../schema';

export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

export const trackRepository = {
  /**
   * Get all tracks with optional pagination
   */
  async getAll(options?: PaginationOptions): Promise<Track[]> {
    try {
      const db = await getDatabase();
      const query = db.select().from(tracks).orderBy(desc(tracks.created_at)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error('[TrackRepository] Error getting all tracks:', error);
      throw new Error(`Failed to get tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get track by ID
   */
  async getById(id: number): Promise<Track | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .select()
        .from(tracks)
        .where(eq(tracks.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[TrackRepository] Error getting track by ID ${id}:`, error);
      throw new Error(`Failed to get track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get track by Jellyfin ID
   */
  async getByJellyfinId(jellyfinId: string): Promise<Track | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .select()
        .from(tracks)
        .where(eq(tracks.jellyfin_id, jellyfinId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[TrackRepository] Error getting track by Jellyfin ID ${jellyfinId}:`, error);
      throw new Error(`Failed to get track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get tracks by album ID
   */
  async getByAlbumId(albumId: number, options?: PaginationOptions): Promise<Track[]> {
    try {
      const db = await getDatabase();
      const query = db
        .select()
        .from(tracks)
        .where(eq(tracks.album_id, albumId))
        .orderBy(asc(tracks.track_number)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error(`[TrackRepository] Error getting tracks by album ID ${albumId}:`, error);
      throw new Error(`Failed to get tracks by album: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get tracks by artist ID
   */
  async getByArtistId(artistId: number, options?: PaginationOptions): Promise<Track[]> {
    try {
      const db = await getDatabase();
      const query = db
        .select()
        .from(tracks)
        .where(eq(tracks.artist_id, artistId))
        .orderBy(desc(tracks.created_at)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error(`[TrackRepository] Error getting tracks by artist ID ${artistId}:`, error);
      throw new Error(`Failed to get tracks by artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Create a new track
   */
  async create(data: NewTrack): Promise<Track> {
    try {
      const db = await getDatabase();
      const result = await db.insert(tracks).values(data).returning();
      
      if (!result[0]) {
        throw new Error('Failed to create track: No data returned');
      }
      
      return result[0];
    } catch (error) {
      console.error('[TrackRepository] Error creating track:', error);
      throw new Error(`Failed to create track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update an existing track
   */
  async update(id: number, data: Partial<NewTrack>): Promise<Track> {
    try {
      const db = await getDatabase();
      const updateData = {
        ...data,
        updated_at: new Date(),
      };
      
      const result = await db
        .update(tracks)
        .set(updateData)
        .where(eq(tracks.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Track not found');
      }
      
      return result[0];
    } catch (error) {
      console.error(`[TrackRepository] Error updating track ${id}:`, error);
      throw new Error(`Failed to update track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Delete a track
   */
  async delete(id: number): Promise<void> {
    try {
      const db = await getDatabase();
      await db.delete(tracks).where(eq(tracks.id, id));
    } catch (error) {
      console.error(`[TrackRepository] Error deleting track ${id}:`, error);
      throw new Error(`Failed to delete track: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Search tracks by name (case-insensitive)
   */
  async search(query: string, options?: PaginationOptions): Promise<Track[]> {
    try {
      const db = await getDatabase();
      const searchQuery = db
        .select()
        .from(tracks)
        .where(like(tracks.name, `%${query}%`))
        .orderBy(desc(tracks.name)).$dynamic();
      
      if (options?.limit !== undefined) {
        searchQuery.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        searchQuery.offset(options.offset);
      }
      
      return await searchQuery;
    } catch (error) {
      console.error(`[TrackRepository] Error searching tracks with query "${query}":`, error);
      throw new Error(`Failed to search tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
