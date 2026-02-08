import { getDatabase } from './connection';

// Import all migration SQL files
// In React Native, we need to embed migrations in the bundle
const migrations = [
  {
    id: '0000_initial',
    sql: `CREATE TABLE \`albums\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`artist_id\` integer NOT NULL,
	\`artist\` text NOT NULL,
	\`year\` integer,
	\`image_url\` text,
	\`jellyfin_id\` text NOT NULL,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL,
	FOREIGN KEY (\`artist_id\`) REFERENCES \`artists\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`albums_jellyfin_id_unique\` ON \`albums\` (\`jellyfin_id\`);--> statement-breakpoint
CREATE INDEX \`albums_artist_id_idx\` ON \`albums\` (\`artist_id\`);--> statement-breakpoint
CREATE INDEX \`albums_name_idx\` ON \`albums\` (\`name\`);--> statement-breakpoint
CREATE INDEX \`albums_year_idx\` ON \`albums\` (\`year\`);--> statement-breakpoint
CREATE TABLE \`artists\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`jellyfin_id\` text NOT NULL,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`artists_jellyfin_id_unique\` ON \`artists\` (\`jellyfin_id\`);--> statement-breakpoint
CREATE INDEX \`artists_name_idx\` ON \`artists\` (\`name\`);--> statement-breakpoint
CREATE TABLE \`playlist_tracks\` (
	\`playlist_id\` integer NOT NULL,
	\`track_id\` integer NOT NULL,
	\`position\` integer NOT NULL,
	\`created_at\` integer NOT NULL,
	PRIMARY KEY(\`playlist_id\`, \`position\`),
	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`track_id\`) REFERENCES \`tracks\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX \`playlist_tracks_playlist_id_idx\` ON \`playlist_tracks\` (\`playlist_id\`);--> statement-breakpoint
CREATE INDEX \`playlist_tracks_track_id_idx\` ON \`playlist_tracks\` (\`track_id\`);--> statement-breakpoint
CREATE TABLE \`playlists\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`jellyfin_id\` text NOT NULL,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`playlists_jellyfin_id_unique\` ON \`playlists\` (\`jellyfin_id\`);--> statement-breakpoint
CREATE INDEX \`playlists_name_idx\` ON \`playlists\` (\`name\`);--> statement-breakpoint
CREATE TABLE \`tracks\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`album_id\` integer NOT NULL,
	\`artist_id\` integer NOT NULL,
	\`duration\` integer NOT NULL,
	\`track_number\` integer,
	\`jellyfin_id\` text NOT NULL,
	\`file_path\` text,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL,
	FOREIGN KEY (\`album_id\`) REFERENCES \`albums\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`artist_id\`) REFERENCES \`artists\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`tracks_jellyfin_id_unique\` ON \`tracks\` (\`jellyfin_id\`);--> statement-breakpoint
CREATE INDEX \`tracks_album_id_idx\` ON \`tracks\` (\`album_id\`);--> statement-breakpoint
CREATE INDEX \`tracks_artist_id_idx\` ON \`tracks\` (\`artist_id\`);--> statement-breakpoint
CREATE INDEX \`tracks_name_idx\` ON \`tracks\` (\`name\`);--> statement-breakpoint
CREATE INDEX \`tracks_track_number_idx\` ON \`tracks\` (\`track_number\`);`,
  },
];

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(sqliteDb: any): Promise<void> {
  sqliteDb.execute(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(sqliteDb: any): Promise<string[]> {
  try {
    const result = sqliteDb.execute('SELECT hash FROM __drizzle_migrations ORDER BY id;');
    return result.rows?._array?.map((row: any) => row.hash) || [];
  } catch (error) {
    console.error('[Database] Error reading migrations:', error);
    return [];
  }
}

/**
 * Record a migration as applied
 */
async function recordMigration(sqliteDb: any, hash: string): Promise<void> {
  const now = Date.now();
  sqliteDb.execute(
    'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?);',
    [hash, now]
  );
}

/**
 * Run pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('[Database] Starting migrations...');
    const db = await getDatabase();

    // Get the underlying SQLite connection from Drizzle
    // @ts-expect-error - Accessing internal property for raw SQL execution
    const sqliteDb = db._.session.client;

    // Create migrations tracking table
    await createMigrationsTable(sqliteDb);

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(sqliteDb);
    console.log('[Database] Applied migrations:', appliedMigrations);

    // Find pending migrations
    const pendingMigrations = migrations.filter(
      (migration) => !appliedMigrations.includes(migration.id)
    );

    if (pendingMigrations.length === 0) {
      console.log('[Database] No pending migrations');
      return;
    }

    console.log(`[Database] Running ${pendingMigrations.length} pending migration(s)...`);

    // Run each pending migration
    for (const migration of pendingMigrations) {
      console.log(`[Database] Applying migration: ${migration.id}`);

      try {
        // Split SQL by statement breakpoints
        const statements = migration.sql
          .split('--> statement-breakpoint')
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0);

        // Execute each statement
        for (const statement of statements) {
          sqliteDb.execute(statement);
        }

        // Record migration as applied
        await recordMigration(sqliteDb, migration.id);
        console.log(`[Database] ✓ Migration ${migration.id} applied successfully`);
      } catch (error) {
        console.error(`[Database] ✗ Migration ${migration.id} failed:`, error);
        throw error;
      }
    }

    console.log('[Database] All migrations completed successfully');
  } catch (error) {
    console.error('[Database] Migration error:', error);
    throw error;
  }
}
