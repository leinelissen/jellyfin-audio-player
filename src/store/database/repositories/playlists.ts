import { eq, like, desc, asc, and } from 'drizzle-orm';
import { getDatabase } from '../connection';
import { playlists, Playlist, NewPlaylist, playlist_tracks, PlaylistTrack, NewPlaylistTrack, tracks, Track } from '../schema';

export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

export interface PlaylistWithTrack extends Track {
  position: number;
}

export const playlistRepository = {
  /**
   * Get all playlists with optional pagination
   */
  async getAll(options?: PaginationOptions): Promise<Playlist[]> {
    try {
      const db = await getDatabase();
      const query = db.select().from(playlists).orderBy(desc(playlists.created_at)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error('[PlaylistRepository] Error getting all playlists:', error);
      throw new Error(`Failed to get playlists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get playlist by ID
   */
  async getById(id: number): Promise<Playlist | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .select()
        .from(playlists)
        .where(eq(playlists.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[PlaylistRepository] Error getting playlist by ID ${id}:`, error);
      throw new Error(`Failed to get playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get playlist by Jellyfin ID
   */
  async getByJellyfinId(jellyfinId: string): Promise<Playlist | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .select()
        .from(playlists)
        .where(eq(playlists.jellyfin_id, jellyfinId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[PlaylistRepository] Error getting playlist by Jellyfin ID ${jellyfinId}:`, error);
      throw new Error(`Failed to get playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Create a new playlist
   */
  async create(data: NewPlaylist): Promise<Playlist> {
    try {
      const db = await getDatabase();
      const result = await db.insert(playlists).values(data).returning();
      
      if (!result[0]) {
        throw new Error('Failed to create playlist: No data returned');
      }
      
      return result[0];
    } catch (error) {
      console.error('[PlaylistRepository] Error creating playlist:', error);
      throw new Error(`Failed to create playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update an existing playlist
   */
  async update(id: number, data: Partial<NewPlaylist>): Promise<Playlist> {
    try {
      const db = await getDatabase();
      const updateData = {
        ...data,
        updated_at: new Date(),
      };
      
      const result = await db
        .update(playlists)
        .set(updateData)
        .where(eq(playlists.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Playlist not found');
      }
      
      return result[0];
    } catch (error) {
      console.error(`[PlaylistRepository] Error updating playlist ${id}:`, error);
      throw new Error(`Failed to update playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Delete a playlist
   */
  async delete(id: number): Promise<void> {
    try {
      const db = await getDatabase();
      await db.delete(playlists).where(eq(playlists.id, id));
    } catch (error) {
      console.error(`[PlaylistRepository] Error deleting playlist ${id}:`, error);
      throw new Error(`Failed to delete playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Search playlists by name (case-insensitive)
   */
  async search(query: string, options?: PaginationOptions): Promise<Playlist[]> {
    try {
      const db = await getDatabase();
      const searchQuery = db
        .select()
        .from(playlists)
        .where(like(playlists.name, `%${query}%`))
        .orderBy(desc(playlists.name)).$dynamic();
      
      if (options?.limit !== undefined) {
        searchQuery.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        searchQuery.offset(options.offset);
      }
      
      return await searchQuery;
    } catch (error) {
      console.error(`[PlaylistRepository] Error searching playlists with query "${query}":`, error);
      throw new Error(`Failed to search playlists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Add a track to a playlist at a specific position
   */
  async addTrack(playlistId: number, trackId: number, position: number): Promise<PlaylistTrack> {
    try {
      const db = await getDatabase();
      const data: NewPlaylistTrack = {
        playlist_id: playlistId,
        track_id: trackId,
        position,
      };
      
      const result = await db.insert(playlist_tracks).values(data).returning();
      
      if (!result[0]) {
        throw new Error('Failed to add track to playlist: No data returned');
      }
      
      return result[0];
    } catch (error) {
      console.error(`[PlaylistRepository] Error adding track ${trackId} to playlist ${playlistId}:`, error);
      throw new Error(`Failed to add track to playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Remove a track from a playlist at a specific position
   */
  async removeTrack(playlistId: number, trackId: number): Promise<void> {
    try {
      const db = await getDatabase();
      await db
        .delete(playlist_tracks)
        .where(
          and(
            eq(playlist_tracks.playlist_id, playlistId),
            eq(playlist_tracks.track_id, trackId)
          )
        );
    } catch (error) {
      console.error(`[PlaylistRepository] Error removing track ${trackId} from playlist ${playlistId}:`, error);
      throw new Error(`Failed to remove track from playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get all tracks for a playlist, ordered by position
   */
  async getTracksForPlaylist(playlistId: number, options?: PaginationOptions): Promise<PlaylistWithTrack[]> {
    try {
      const db = await getDatabase();
      const query = db
        .select({
          id: tracks.id,
          name: tracks.name,
          album_id: tracks.album_id,
          artist_id: tracks.artist_id,
          duration: tracks.duration,
          track_number: tracks.track_number,
          jellyfin_id: tracks.jellyfin_id,
          file_path: tracks.file_path,
          created_at: tracks.created_at,
          updated_at: tracks.updated_at,
          position: playlist_tracks.position,
        })
        .from(playlist_tracks)
        .innerJoin(tracks, eq(playlist_tracks.track_id, tracks.id))
        .where(eq(playlist_tracks.playlist_id, playlistId))
        .orderBy(asc(playlist_tracks.position)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error(`[PlaylistRepository] Error getting tracks for playlist ${playlistId}:`, error);
      throw new Error(`Failed to get playlist tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
