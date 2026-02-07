import { eq, like, desc } from 'drizzle-orm';
import { getDatabase } from '../connection';
import { artists, Artist, NewArtist } from '../schema';

export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

export const artistRepository = {
  /**
   * Get all artists with optional pagination
   */
  async getAll(options?: PaginationOptions): Promise<Artist[]> {
    try {
      const db = await getDatabase();
      const query = db.select().from(artists).orderBy(desc(artists.created_at)).$dynamic();
      
      if (options?.limit !== undefined) {
        query.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        query.offset(options.offset);
      }
      
      return await query;
    } catch (error) {
      console.error('[ArtistRepository] Error getting all artists:', error);
      throw new Error(`Failed to get artists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get artist by ID
   */
  async getById(id: number): Promise<Artist | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .select()
        .from(artists)
        .where(eq(artists.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[ArtistRepository] Error getting artist by ID ${id}:`, error);
      throw new Error(`Failed to get artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get artist by Jellyfin ID
   */
  async getByJellyfinId(jellyfinId: string): Promise<Artist | null> {
    try {
      const db = await getDatabase();
      const result = await db
        .select()
        .from(artists)
        .where(eq(artists.jellyfin_id, jellyfinId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[ArtistRepository] Error getting artist by Jellyfin ID ${jellyfinId}:`, error);
      throw new Error(`Failed to get artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Create a new artist
   */
  async create(data: NewArtist): Promise<Artist> {
    try {
      const db = await getDatabase();
      const result = await db.insert(artists).values(data).returning();
      
      if (!result[0]) {
        throw new Error('Failed to create artist: No data returned');
      }
      
      return result[0];
    } catch (error) {
      console.error('[ArtistRepository] Error creating artist:', error);
      throw new Error(`Failed to create artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update an existing artist
   */
  async update(id: number, data: Partial<NewArtist>): Promise<Artist> {
    try {
      const db = await getDatabase();
      const updateData = {
        ...data,
        updated_at: new Date(),
      };
      
      const result = await db
        .update(artists)
        .set(updateData)
        .where(eq(artists.id, id))
        .returning();
      
      if (!result[0]) {
        throw new Error('Artist not found');
      }
      
      return result[0];
    } catch (error) {
      console.error(`[ArtistRepository] Error updating artist ${id}:`, error);
      throw new Error(`Failed to update artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Delete an artist
   */
  async delete(id: number): Promise<void> {
    try {
      const db = await getDatabase();
      await db.delete(artists).where(eq(artists.id, id));
    } catch (error) {
      console.error(`[ArtistRepository] Error deleting artist ${id}:`, error);
      throw new Error(`Failed to delete artist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Search artists by name (case-insensitive)
   */
  async search(query: string, options?: PaginationOptions): Promise<Artist[]> {
    try {
      const db = await getDatabase();
      const searchQuery = db
        .select()
        .from(artists)
        .where(like(artists.name, `%${query}%`))
        .orderBy(desc(artists.name)).$dynamic();
      
      if (options?.limit !== undefined) {
        searchQuery.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        searchQuery.offset(options.offset);
      }
      
      return await searchQuery;
    } catch (error) {
      console.error(`[ArtistRepository] Error searching artists with query "${query}":`, error);
      throw new Error(`Failed to search artists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
