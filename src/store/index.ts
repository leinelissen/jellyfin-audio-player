import { drizzle } from 'drizzle-orm/op-sqlite';
import { open } from '@op-engineering/op-sqlite';
import { migrate } from 'drizzle-orm/op-sqlite/migrator';
import migrations from './database/migrations/migrations.js';
import { relations, schema } from './database/relations';

import { driverRegistry } from './sources/drivers/registry';
import Settings from './settings/manager';

// Open the SQLite database
export const sqliteDb = open({
    name: 'fintunes.db',
});

console.log('[DB] Database path:', sqliteDb.getDbPath());

// Create drizzle instance with v2 relations — exported as singleton
export const db = drizzle(sqliteDb, { schema, relations });

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
        // TODO: Swallow errors, there is an issue where some migrations fail
        // throw error;
    }
}

// Singleton promise so that concurrent calls to initialiseDatabase (e.g. from
// React Fast Refresh double-mounting) share a single in-flight initialisation
// rather than racing against each other and re-running migrations.
let initialisationPromise: Promise<typeof db> | null = null;

/**
 * Initialise the database.
 * Safe to call multiple times — subsequent calls return the same promise.
 */
export function initialiseDatabase(): Promise<typeof db> {
    if (!initialisationPromise) {
        initialisationPromise = (async () => {
            await runMigrations();
            await Promise.all([
                driverRegistry.initialise(),
                Settings.initialise(),
            ]);
            return db;
        })();
    }
    return initialisationPromise;
}
