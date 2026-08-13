/**
 * Artwork Manager
 *
 * A singleton that resolves artwork URLs for any locally-stored entity
 * (album, artist, track, or playlist) by delegating to the correct
 * SourceDriver via the driver registry.
 *
 * Design goals
 * ------------
 * - Single responsibility: "given an entity, give me an image URL".
 * - No network calls — drivers build URLs synchronously from the cached
 *   source credentials; the manager just routes to the right driver.
 * - Works with any member of the ArtworkEntity union, which covers every
 *   entity table in the local database.
 * - Provides a single synchronous `getUrl` method — the registry is always
 *   warm after `initialiseDatabase` completes, so no async variant is needed.
 *
 * Usage
 * -----
 *   import Artwork from '@/store/sources/artwork-manager';
 *
 *   const url = Artwork.getUrl(album);
 *   const url = Artwork.getUrl(track, { width: 512 });
 */

import type { ArtworkEntity, ArtworkOptions } from './types';
import { driverRegistry } from './drivers/registry';

class ArtworkManager {
    /**
     * Resolve an artwork URL for a given entity from the warm driver cache.
     *
     * Returns `undefined` when no driver is registered for the entity's source
     * (e.g. the source was removed) or when the driver itself cannot produce a
     * URL.
     *
     * Safe to call inside `useMemo`, `useCallback`, and JSX — no side-effects,
     * no awaiting.
     */
    getUrl(
        entity: ArtworkEntity | null | undefined,
        options?: ArtworkOptions,
    ): string | undefined {
        if (!entity) {
            return undefined;
        }

        const driver = driverRegistry.getById(entity.sourceId);

        if (!driver) {
            return undefined;
        }

        return driver.getArtworkUrl(entity, options);
    }

    /**
     * Resolve artwork URLs for a batch of entities.
     *
     * The result array preserves the input order; entries whose driver is
     * missing resolve to `undefined`.
     */
    getBatchUrls(
        entities: ArtworkEntity[],
        options?: ArtworkOptions,
    ): (string | undefined)[] {
        return entities.map(entity => this.getUrl(entity, options));
    }
}

/**
 * The global artwork manager.
 *
 * Import this wherever an artwork URL is needed:
 *
 *   import Artwork from '@/store/sources/artwork-manager';
 */
const Artwork = new ArtworkManager();

export default Artwork;
