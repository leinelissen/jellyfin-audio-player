import type { Track as PlayerTrack } from 'react-native-track-player';
import type { EntityId } from '@/store/types';
import type { Track } from '@/store/tracks/types';
import { driverRegistry } from '@/store/sources/drivers/registry';

export async function generateTrack(track: Track): Promise<PlayerTrack> {
    const driver = driverRegistry.getById(track.sourceId);
    const url = driver ? await driver.getStreamUrl(track.id) : '';
    const artwork = driver ? driver.getArtworkUrl(track) : undefined;

    const entityId: EntityId = [track.sourceId, track.id];

    return {
        id: track.id,
        url,
        title: track.name,
        artist: track.albumArtist ?? undefined,
        album: track.album ?? undefined,
        artwork,
        duration: track.runTimeTicks ? track.runTimeTicks / 10_000_000 : undefined,
        entityId,
    } as PlayerTrack;
}