import { drizzle } from 'drizzle-orm/op-sqlite';
import { open } from '@op-engineering/op-sqlite';
import { migrate } from 'drizzle-orm/op-sqlite/migrator';
import migrations from './database/migrations/migrations.js';

// Import all schema tables
import sources from './sources/entity';
import settings from './settings/entity';
import sleepTimer from './sleep-timer/entity';
import artists from './artists/entity';
import albums from './albums/entity';
import tracks from './tracks/entity';
import playlists from './playlists/entity';
import downloads from './downloads/entity';
import searchQueries from './search-queries/entity';
import albumArtists from './album-artists/entity';
import trackArtists from './track-artists/entity';
import playlistTracks from './playlist-tracks/entity';
import albumSimilar from './album-similar/entity';
import syncCursors from './sync-cursors/entity';

// Combined schema for drizzle
const schema = {
    sources,
    settings,
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
export const sqliteDb = open({
    name: 'fintunes.db',
    location: '../databases',
});

// Create drizzle instance with schema - exported as singleton
export const db = drizzle(sqliteDb, { schema });

/**
 * Run database migrations
 * Migrations should be generated using drizzle-kit
 */
export async function runMigrations() {
    try {
        await migrate(db, migrations);
        console.log('Database migrations completed');
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
}

/**
 * Initialize the database
 */
export async function initializeDatabase() {
    await runMigrations();
    return db;
}
