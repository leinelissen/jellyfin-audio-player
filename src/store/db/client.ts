import { drizzle } from 'drizzle-orm/op-sqlite';
import { open } from '@op-engineering/op-sqlite';
import { migrate } from 'drizzle-orm/op-sqlite/migrator';

// Import all schema tables
import { sources } from './schema/sources';
import { appSettings } from './schema/app-settings';
import { sleepTimer } from './schema/sleep-timer';
import { artists } from './schema/artists';
import { albums } from './schema/albums';
import { tracks } from './schema/tracks';
import { playlists } from './schema/playlists';
import { downloads } from './schema/downloads';
import { searchQueries } from './schema/search-queries';
import { albumArtists } from './schema/album-artists';
import { trackArtists } from './schema/track-artists';
import { playlistTracks } from './schema/playlist-tracks';
import { albumSimilar } from './schema/album-similar';
import { syncCursors } from './schema/sync-cursors';

// Combined schema for drizzle
const schema = {
  sources,
  appSettings,
  sleepTimer,
  artists,
  albums,
  tracks,
  playlists,
  downloads,
  searchQueries,
  albumArtists,
  trackArtists,
  playlistTracks,
  albumSimilar,
  syncCursors,
};

// Open the SQLite database
const sqliteDb = open({
  name: 'fintunes.db',
  location: '../databases',
});

// Create drizzle instance with schema - exported as singleton
export const db = drizzle(sqliteDb, { schema });

/**
 * Run database migrations
 * Migrations should be generated using drizzle-kit
 */
export function runMigrations() {
  try {
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database migrations completed');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

/**
 * Initialize the database
 */
export function initializeDatabase() {
  runMigrations();
  return db;
}
