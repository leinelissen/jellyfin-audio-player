import { getDatabase } from './connection';

/**
 * Create all database tables if they don't exist
 * This ensures the database schema is initialized on first app launch
 */
export async function initializeDatabaseSchema(): Promise<void> {
  try {
    console.log('[Database] Initializing database schema...');
    const db = await getDatabase();
    
    // Get the underlying SQLite connection from Drizzle
    // @ts-expect-error - Accessing internal property for raw SQL execution
    const sqliteDb = db._.session.client;
    
    // Create artists table
    sqliteDb.execute(`
      CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        jellyfin_id TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS artists_name_idx ON artists(name);
    `);
    
    // Create albums table
    sqliteDb.execute(`
      CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        artist_id INTEGER NOT NULL,
        artist TEXT NOT NULL,
        year INTEGER,
        image_url TEXT,
        jellyfin_id TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
      );
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS albums_artist_id_idx ON albums(artist_id);
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS albums_name_idx ON albums(name);
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS albums_year_idx ON albums(year);
    `);
    
    // Create tracks table
    sqliteDb.execute(`
      CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        album_id INTEGER NOT NULL,
        artist_id INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        track_number INTEGER,
        jellyfin_id TEXT NOT NULL UNIQUE,
        file_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
      );
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS tracks_album_id_idx ON tracks(album_id);
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS tracks_artist_id_idx ON tracks(artist_id);
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS tracks_name_idx ON tracks(name);
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS tracks_track_number_idx ON tracks(track_number);
    `);
    
    // Create playlists table
    sqliteDb.execute(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        jellyfin_id TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS playlists_name_idx ON playlists(name);
    `);
    
    // Create playlist_tracks junction table
    sqliteDb.execute(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id INTEGER NOT NULL,
        track_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (playlist_id, position),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS playlist_tracks_playlist_id_idx ON playlist_tracks(playlist_id);
    `);
    
    sqliteDb.execute(`
      CREATE INDEX IF NOT EXISTS playlist_tracks_track_id_idx ON playlist_tracks(track_id);
    `);
    
    console.log('[Database] Schema initialization completed successfully');
  } catch (error) {
    console.error('[Database] Error initializing schema:', error);
    // Don't throw - allow app to continue without database if initialization fails
    console.warn('[Database] App will continue without database functionality');
  }
}
