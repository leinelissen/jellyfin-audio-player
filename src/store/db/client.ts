import { open } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';
import * as schema from './schema';

/**
 * SQLite database client singleton
 */
let db: ReturnType<typeof drizzle> | null = null;
let rawDb: ReturnType<typeof open> | null = null;

/**
 * Initialize the database connection and run migrations
 */
export function initializeDatabase() {
  if (db) {
    return db;
  }

  // Open the database
  rawDb = open({
    name: 'fintunes.db',
    location: '../databases',
  });

  // Create drizzle instance
  db = drizzle(rawDb, { schema });

  // Run migrations (create tables if they don't exist)
  runMigrations();

  return db;
}

/**
 * Get the database instance (initialize if needed)
 */
export function getDatabase() {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Get the raw database instance
 */
export function getRawDatabase() {
  if (!rawDb) {
    initializeDatabase();
  }
  return rawDb!;
}

/**
 * Run database migrations (create tables)
 */
function runMigrations() {
  if (!rawDb) {
    throw new Error('Database not initialized');
  }

  // Create tables
  const migrations = [
    // Sources table
    `CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      uri TEXT NOT NULL,
      user_id TEXT,
      access_token TEXT,
      device_id TEXT,
      type TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // App settings table
    `CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY,
      bitrate INTEGER NOT NULL,
      is_onboarding_complete INTEGER NOT NULL,
      has_received_error_reporting_alert INTEGER NOT NULL,
      enable_playback_reporting INTEGER NOT NULL,
      color_scheme TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Sleep timer table
    `CREATE TABLE IF NOT EXISTS sleep_timer (
      id INTEGER PRIMARY KEY,
      date INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Artists table
    `CREATE TABLE IF NOT EXISTS artists (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_folder INTEGER NOT NULL,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Albums table
    `CREATE TABLE IF NOT EXISTS albums (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      production_year INTEGER,
      is_folder INTEGER NOT NULL,
      album_artist TEXT,
      date_created INTEGER,
      last_refreshed INTEGER,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Tracks table
    `CREATE TABLE IF NOT EXISTS tracks (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      album_id TEXT,
      album TEXT,
      album_artist TEXT,
      production_year INTEGER,
      index_number INTEGER,
      parent_index_number INTEGER,
      has_lyrics INTEGER NOT NULL DEFAULT 0,
      run_time_ticks INTEGER,
      lyrics TEXT,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Playlists table
    `CREATE TABLE IF NOT EXISTS playlists (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      can_delete INTEGER NOT NULL,
      child_count INTEGER,
      last_refreshed INTEGER,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Downloads table
    `CREATE TABLE IF NOT EXISTS downloads (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      id TEXT PRIMARY KEY,
      hash TEXT,
      filename TEXT,
      mimetype TEXT,
      progress INTEGER,
      is_failed INTEGER NOT NULL,
      is_complete INTEGER NOT NULL,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Search queries table
    `CREATE TABLE IF NOT EXISTS search_queries (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      local_playback_only INTEGER NOT NULL,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Album-Artists relation table
    `CREATE TABLE IF NOT EXISTS album_artists (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      album_id TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      order_index INTEGER,
      PRIMARY KEY (source_id, album_id, artist_id)
    )`,

    // Track-Artists relation table
    `CREATE TABLE IF NOT EXISTS track_artists (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      track_id TEXT NOT NULL,
      artist_id TEXT NOT NULL,
      order_index INTEGER,
      PRIMARY KEY (source_id, track_id, artist_id)
    )`,

    // Playlist-Tracks relation table
    `CREATE TABLE IF NOT EXISTS playlist_tracks (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      playlist_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      position INTEGER,
      PRIMARY KEY (source_id, playlist_id, track_id)
    )`,

    // Album-Similar relation table
    `CREATE TABLE IF NOT EXISTS album_similar (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      album_id TEXT NOT NULL,
      similar_album_id TEXT NOT NULL,
      PRIMARY KEY (source_id, album_id, similar_album_id)
    )`,

    // Sync cursors table
    `CREATE TABLE IF NOT EXISTS sync_cursors (
      source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      start_index INTEGER NOT NULL,
      page_size INTEGER NOT NULL,
      completed INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (source_id, entity_type)
    )`,

    // Create indexes
    `CREATE INDEX IF NOT EXISTS artists_source_name_idx ON artists(source_id, name)`,
    `CREATE INDEX IF NOT EXISTS albums_source_name_idx ON albums(source_id, name)`,
    `CREATE INDEX IF NOT EXISTS albums_source_year_idx ON albums(source_id, production_year)`,
    `CREATE INDEX IF NOT EXISTS tracks_source_album_idx ON tracks(source_id, album_id)`,
    `CREATE INDEX IF NOT EXISTS tracks_source_name_idx ON tracks(source_id, name)`,
    `CREATE INDEX IF NOT EXISTS playlists_source_name_idx ON playlists(source_id, name)`,
    `CREATE INDEX IF NOT EXISTS playlist_tracks_source_playlist_position_idx ON playlist_tracks(source_id, playlist_id, position)`,
    `CREATE INDEX IF NOT EXISTS track_artists_source_artist_idx ON track_artists(source_id, artist_id)`,
    `CREATE INDEX IF NOT EXISTS album_artists_source_artist_idx ON album_artists(source_id, artist_id)`,
    `CREATE INDEX IF NOT EXISTS search_queries_source_timestamp_idx ON search_queries(source_id, timestamp)`,
  ];

  // Execute migrations
  migrations.forEach((sql) => {
    rawDb!.execute(sql);
  });

  console.log('Database migrations completed');
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (rawDb) {
    rawDb.close();
    rawDb = null;
    db = null;
  }
}
