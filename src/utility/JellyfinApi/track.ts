import type { Track as PlayerTrack } from 'react-native-track-player';
import { db } from '@/store';
import sources from '@/store/sources/entity';
import { JellyfinDriver } from '@/store/sources/drivers/jellyfin/driver';
import { EmbyDriver } from '@/store/sources/drivers/emby/driver';
import type { Source, SourceDriver, SourceType } from '@/store/sources/types';
import type { AlbumTrack } from '@/store/music/types';
import { getCredentials, getImage } from './lib';

async function getDriver(): Promise<{ driver: SourceDriver; source: Source } | null> {
    const result = await db.select().from(sources).limit(1);
    const row = result[0];

    if (!row) {
        return null;
    }

    const source: Source = {
        id: row.id,
        uri: row.uri,
        userId: row.userId || undefined,
        accessToken: row.accessToken || undefined,
        deviceId: row.deviceId || undefined,
        type: row.type as SourceType,
    };

    if (source.type.startsWith('jellyfin')) {
        return { driver: new JellyfinDriver(source), source };
    }

    if (source.type.startsWith('emby')) {
        return { driver: new EmbyDriver(source), source };
    }

    return null;
}

export async function generateTrack(track: AlbumTrack): Promise<PlayerTrack> {
    const driverResult = await getDriver();
    const credentials = await getCredentials();
    const artwork = credentials ? getImage(track, credentials) : undefined;
    const url = driverResult ? await driverResult.driver.getStreamUrl(track.Id) : '';

    return {
        id: track.Id,
        url,
        title: track.Name,
        artist: track.AlbumArtist || undefined,
        album: track.Album || undefined,
        artwork,
        duration: track.RunTimeTicks ? track.RunTimeTicks / 10_000_000 : undefined,
        backendId: track.Id,
    } as PlayerTrack;
}
