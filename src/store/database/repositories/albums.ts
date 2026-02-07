import { eq, like, desc } from 'drizzle-orm';
import { getDatabase } from '../connection';
import { albums, Album, NewAlbum } from '../schema';

export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

export const albumRepository = {
  /**
   * Get all albums with optional pagination
   */
  async getAll(options?: PaginationOptions): Promise<Album[]> {
    try {
      const db = await getDatabase();
      const query = db.select().from(albums).orderBy(desc(albums.created_at)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error('[AlbumRepository] Error getting all albums:', error);
      throw new Error(`Failed to get albums: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get album by ID
   */
  async getById(id: number): Promise<Album | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .select()
        .from(albums)
        .where(eq(albums.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[AlbumRepository] Error getting album by ID ${id}:`, error);
      throw new Error(`Failed to get album: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get album by Jellyfin ID
   */
  async getByJellyfinId(jellyfinId: string): Promise<Album | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .select()
        .from(albums)
        .where(eq(albums.jellyfin_id, jellyfinId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[AlbumRepository] Error getting album by Jellyfin ID ${jellyfinId}:`, error);
      throw new Error(`Failed to get album: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get albums by artist ID
   */
  async getByArtistId(artistId: number, options?: PaginationOptions): Promise<Album[]> {
    try {
      const db = await getDatabase();
      const query = db
        .select()
        .from(albums)
        .where(eq(albums.artist_id, artistId))
        .orderBy(desc(albums.year)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error(`[AlbumRepository] Error getting albums by artist ID ${artistId}:`, error);
      throw new Error(`Failed to get albums by artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get albums by year
   */
  async getByYear(year: number, options?: PaginationOptions): Promise<Album[]> {
    try {
      const db = await getDatabase();
      const query = db
        .select()
        .from(albums)
        .where(eq(albums.year, year))
        .orderBy(desc(albums.name)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error(`[AlbumRepository] Error getting albums by year ${year}:`, error);
      throw new Error(`Failed to get albums by year: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Create a new album
   */
  async create(data: NewAlbum): Promise<Album> {
    try {
      const db = await getDatabase();
      const result = await db.insert(albums).values(data).returning();
      
      if (!result[0]) {
        throw new Error('Failed to create album: No data returned');
      }
      
      return result[0];
    } catch (error) {
      console.error('[AlbumRepository] Error creating album:', error);
      throw new Error(`Failed to create album: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update an existing album
   */
  async update(id: number, data: Partial<NewAlbum>): Promise<Album> {
    try {
      const db = await getDatabase();
      const updateData = {
        ...data,
        updated_at: new Date(),
      };
      
      const result = await db
        .update(albums)
        .set(updateData)
        .where(eq(albums.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Album not found');
      }
      
      return result[0];
    } catch (error) {
      console.error(`[AlbumRepository] Error updating album ${id}:`, error);
      throw new Error(`Failed to update album: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Delete an album
   */
  async delete(id: number): Promise<void> {
    try {
      const db = await getDatabase();
      await db.delete(albums).where(eq(albums.id, id));
    } catch (error) {
      console.error(`[AlbumRepository] Error deleting album ${id}:`, error);
      throw new Error(`Failed to delete album: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Search albums by name (case-insensitive)
   */
  async search(query: string, options?: PaginationOptions): Promise<Album[]> {
    try {
      const db = await getDatabase();
      const searchQuery = db
        .select()
        .from(albums)
        .where(like(albums.name, `%${query}%`))
        .orderBy(desc(albums.name)).$dynamic();
      
      if (options?.limit !== undefined) {
        searchQuery.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        searchQuery.offset(options.offset);
      }
      
      return await searchQuery;
    } catch (error) {
      console.error(`[AlbumRepository] Error searching albums with query "${query}":`, error);
      throw new Error(`Failed to search albums: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
