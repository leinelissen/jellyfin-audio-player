import type { EntityId } from '@/store/types';
import { driverRegistry } from '@/store/sources/drivers/registry';
import { getTracksWithDownloadsByIds } from '@/store/tracks/actions';
import type { TrackWithDownload } from '@/store/tracks/hooks';

/**
 * Retrieves an instant mix (radio-style queue) seeded from the given track.
 * Delegates to the source driver so it works for both Jellyfin and Emby.
 *
 * After fetching the track IDs from the API, each track is looked up in the
 * local database so the full DB row (including its download entry) is returned.
 * Tracks not yet synced locally are dropped from the result.
 *
 * Returns an array of TrackWithDownload objects in playback order. The first
 * item is typically the seed track itself — callers should shift() it off if
 * they are already playing it.
 */
export async function retrieveInstantMixByTrackId([sourceId, trackId]: EntityId): Promise<TrackWithDownload[]> {
    const driver = driverRegistry.getById(sourceId);

    if (!driver) {
        console.warn('[playlist] No driver found for source', sourceId);
        return [];
    }

    try {
        const result = await driver.getInstantMix(trackId);
        return await getTracksWithDownloadsByIds(result.items);
    } catch (error) {
        console.error('[playlist] Failed to retrieve instant mix for track', trackId, error);
        return [];
    }
}