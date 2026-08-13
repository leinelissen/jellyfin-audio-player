/**
 * Settings Manager
 *
 * A singleton that owns an in-memory copy of the single `settings` row so
 * that any module can read the current settings synchronously — without an
 * `await` or a React hook — at any point after the database has been
 * initialised.
 *
 * Lifecycle
 * ---------
 * The manager starts empty (`cache = null`). Calling `initialise()` from
 * `initialiseDatabase` (after migrations have run) loads the row from the
 * database, creating it with defaults if it does not yet exist. All
 * subsequent reads are served from the in-memory cache.
 *
 * Writing is always async: `update()` persists the partial patch to the
 * database and then refreshes the cache so the next synchronous read reflects
 * the change immediately.
 *
 * Concurrent initialisations share a single in-flight promise, exactly as
 * `DriverRegistry` does, so the database is queried at most once even if
 * multiple modules call `initialise()` in parallel during startup.
 */

import { db, sqliteDb } from '@/store';
import settingsEntity from '@/store/settings/entity';
import { eq } from 'drizzle-orm';
import { AppSettings, ColorScheme } from './types';

// ---------------------------------------------------------------------------
// Default values applied on first launch
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
    id: 1,
    bitrate: 140_000_000,
    isOnboardingComplete: false,
    hasReceivedErrorReportingAlert: false,
    enablePlaybackReporting: true,
    colorScheme: ColorScheme.System,
} as const satisfies Partial<typeof settingsEntity.$inferInsert>;

// ---------------------------------------------------------------------------
// Manager class
// ---------------------------------------------------------------------------

type SettingUpdates = Partial<Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>>;

class SettingsManager {
    /**
     * The in-memory settings snapshot. `null` means the manager has not been
     * initialised yet (or has been explicitly invalidated).
     */
    private cache: AppSettings | null = null;

    /**
     * In-flight initialisation promise. Stored so that concurrent callers
     * that arrive before the first `await` resolves all share the same
     * promise rather than racing to insert duplicate rows.
     */
    private initPromise: Promise<AppSettings> | null = null;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Explicitly initialise the manager by loading (or creating) the settings
     * row in the database and caching the result in memory.
     *
     * Must be called after database migrations have completed (i.e. from
     * `initialiseDatabase`) so that the `settings` table exists before the
     * first query is made. Subsequent calls are no-ops when the cache is
     * already warm.
     */
    async initialise(): Promise<void> {
        await this.load();
    }

    /**
     * Return the full settings snapshot from the in-memory cache, or the
     * value of a single field when `key` is provided.
     *
     * Returns `null` when the manager has not yet been initialised. Safe to
     * call on every render — callers should treat `null` as "not ready yet"
     * and fall back to defaults or a loading state as appropriate.
     *
     * @param key  Optional key to pluck a single field from the settings.
     */
    get(): AppSettings | null;
    get<K extends keyof AppSettings>(key: K): AppSettings[K] | null;
    get<K extends keyof AppSettings>(key?: K): AppSettings | AppSettings[K] | null {
        if (key !== undefined) {
            return this.cache?.[key] ?? null;
        }
        return this.cache;
    }

    /**
     * Persist a partial update to the database and refresh the in-memory
     * cache so that the next synchronous read reflects the change immediately.
     *
     * @param updates  A partial object of the settings fields to change.
     *                 `id`, `createdAt`, and `updatedAt` are managed
     *                 automatically and must not be included.
     */
    async update(updates: SettingUpdates): Promise<void> {
        await db
            .update(settingsEntity)
            .set(updates)
            .where(eq(settingsEntity.id, 1));

        sqliteDb.flushPendingReactiveQueries();

        // Re-read from the database so the cache is authoritative rather than
        // being a speculative merge of the previous state and the patch.
        await this.refresh();
    }

    /**
     * Force a re-read from the database and update the in-memory cache.
     *
     * Useful when an external process (e.g. a background sync) may have
     * mutated the `settings` row outside of this manager.
     */
    async refresh(): Promise<void> {
        const row = await db.select().from(settingsEntity).where(eq(settingsEntity.id, 1)).get();
        if (row) {
            this.cache = row;
        }
    }

    /**
     * Invalidate the in-memory cache without touching the database.
     *
     * The next call to `initialise()` or the next `update()` will re-read
     * the row from the database.
     */
    invalidate(): void {
        this.cache = null;
        this.initPromise = null;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Return the settings row, initialising the cache if necessary.
     *
     * Concurrent callers share a single in-flight promise so the database is
     * queried (and the default row potentially inserted) at most once.
     */
    private async load(): Promise<AppSettings> {
        if (this.cache !== null) {
            return this.cache;
        }

        if (this.initPromise === null) {
            this.initPromise = this.build();
        }

        return this.initPromise;
    }

    /**
     * Load or create the settings row, populate the cache, and clear the
     * in-flight promise so future reads hit the cache path directly.
     */
    private async build(): Promise<AppSettings> {
        let row = await db.select().from(settingsEntity).where(eq(settingsEntity.id, 1)).get() ?? null;

        if (row === null) {
            await db.insert(settingsEntity).values(DEFAULT_SETTINGS);
            sqliteDb.flushPendingReactiveQueries();

            // Re-read so the cache always holds a genuine database row rather
            // than the bare insert object (e.g. to capture any DB-level defaults).
            row = (await db.select().from(settingsEntity).where(eq(settingsEntity.id, 1)).get())!;
        }

        this.cache = row;
        this.initPromise = null;

        return row;
    }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * The global settings manager.
 *
 * Import this wherever the current app settings are needed:
 *
 *   import { Settings } from '@/store/settings/manager';
 *
 *   // Synchronous read — full object or single field:
 *   const settings = Settings.get();
 *   const bitrate = Settings.get('bitrate');
 *
 *   // Async write (persists to DB and refreshes cache):
 *   await Settings.update({ colorScheme: ColorScheme.Dark });
 */
const Settings = new SettingsManager();

export default Settings;
