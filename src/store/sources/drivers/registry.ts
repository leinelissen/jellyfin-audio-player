/**
 * Driver Registry
 *
 * A singleton that owns an in-memory, sourceId-keyed map of every
 * instantiated SourceDriver. All other modules (ArtworkManager, playback
 * helpers, etc.) should obtain driver instances through this registry instead
 * of constructing them ad-hoc, so there is always exactly one driver object
 * per source at runtime.
 *
 * Lifecycle
 * ---------
 * The registry starts empty. `initialise()` must be called once from
 * `initialiseDatabase` (after migrations have run) to load every source row
 * from the database and instantiate its driver. All subsequent reads are
 * served synchronously from the in-memory cache.
 *
 * If sources are added, removed, or updated at runtime, call `refresh()` to
 * rebuild the cache from fresh database rows.
 */

import type { SourceDriver } from '../types';
import { getAllSourceDrivers } from '../actions';

class DriverRegistry {
    /**
     * The in-memory driver map. `null` means `initialise()` has not yet been
     * called.
     */
    private cache: Map<string, SourceDriver> | null = null;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Populate the registry by loading all source rows from the database and
     * instantiating their drivers.
     *
     * Must be called after database migrations have completed (i.e. from
     * `initialiseDatabase`). Subsequent calls rebuild the cache, equivalent
     * to calling `refresh()`.
     */
    async initialise(): Promise<void> {
        console.log('[DriverRegistry] Initialising driver registry...');
        await this.build();
    }

    /**
     * Return a map of every registered driver, keyed by sourceId.
     */
    getAll(): Map<string, SourceDriver> {
        return this.cache ?? new Map();
    }

    /**
     * Return the driver for a specific source, or `undefined` if no driver
     * is registered for that sourceId.
     *
     * @param sourceId  The stable source identifier (primary key in `sources`).
     */
    getById(sourceId: string): SourceDriver | undefined {
        return this.cache?.get(sourceId);
    }

    /**
     * Return all drivers as an ordered array.
     *
     * Useful when iterating every source without needing the keyed map.
     */
    toArray(): SourceDriver[] {
        return [...(this.cache ?? new Map()).values()];
    }

    /**
     * Rebuild the in-memory cache from fresh database rows.
     *
     * Call this after adding, removing, or updating a source so that the
     * registry reflects the current state.
     */
    async refresh(): Promise<void> {
        await this.build();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Load all source rows, instantiate a driver for each one, and store the
     * result in `cache`.
     */
    private async build(): Promise<void> {
        const drivers = await getAllSourceDrivers();

        this.cache = new Map<string, SourceDriver>(
            drivers.map(driver => [driver.getSourceId(), driver]),
        );

        console.log(`[DriverRegistry] Built driver cache with ${this.cache.size} entries:`);
    }
}

/**
 * The global driver registry.
 *
 * Import this wherever a SourceDriver is needed:
 *
 *   import { driverRegistry } from '@/store/sources/drivers/registry';
 *
 *   const driver = driverRegistry.getById(sourceId);
 */
export const driverRegistry = new DriverRegistry();
