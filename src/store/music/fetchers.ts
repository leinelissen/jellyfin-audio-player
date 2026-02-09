import { db } from '@/store';
import sources from '@/store/sources/entity';
import { JellyfinDriver } from '@/store/sources/drivers/jellyfin/driver';
import { EmbyDriver } from '@/store/sources/drivers/emby/driver';
import type { Source, SourceDriver, SourceType } from '@/store/sources/types';
import type { Album, AlbumTrack, MusicArtist, Playlist } from './types';
import {
    upsertAlbum,
    upsertAlbums,
    upsertArtist,
    upsertArtists,
    upsertPlaylist,
    upsertPlaylists,
    upsertTrack,
    upsertTracks,
    setPlaylistTracks,
    setSimilarAlbums,
} from './db';

const DEFAULT_LIMIT = 500;

type DriverWithSource = {
    driver: SourceDriver;
    source: Source;
};

async function getDriver(): Promise<DriverWithSource | null> {
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

async function fetchAllPages<T>(
    fetchPage: (offset: number, limit: number) => Promise<T[]>,
    limit: number = DEFAULT_LIMIT,
): Promise<T[]> {
    const results: T[] = [];
    let offset = 0;

    while (true) {
        const page = await fetchPage(offset, limit);
        if (!page.length) {
            break;
        }
        results.push(...page);
        offset += page.length;
        if (page.length < limit) {
            break;
        }
    }

    return results;
}

function mapArtist(artist: { id: string; name: string; isFolder?: boolean; metadataJson?: string | null }): MusicArtist {
    const metadata = artist.metadataJson ? JSON.parse(artist.metadataJson) : {};

    return {
        Id: artist.id,
        Name: artist.name,
        IsFolder: artist.isFolder,
        ...metadata,
    };
}

function mapArtistItems(items?: Array<{ id: string; name: string; metadataJson?: string | null }>): Array<{ Id: string; Name?: string; [key: string]: unknown }> {
    if (!items) {
        return [];
    }

    return items.map((item) => ({
        Id: item.id,
        Name: item.name,
        ...(item.metadataJson ? JSON.parse(item.metadataJson) : {}),
    }));
}

function mapAlbum(album: {
    id: string;
    name: string;
    productionYear?: number | null;
    isFolder?: boolean;
    albumArtist?: string | null;
    dateCreated?: string | null;
    artistItems?: Array<{ id: string; name: string; metadataJson?: string | null }>;
    metadataJson?: string | null;
}): Album {
    const metadata = album.metadataJson ? JSON.parse(album.metadataJson) : {};

    return {
        Id: album.id,
        Name: album.name,
        ProductionYear: album.productionYear || undefined,
        IsFolder: album.isFolder,
        AlbumArtist: album.albumArtist || undefined,
        DateCreated: album.dateCreated || undefined,
        ArtistItems: mapArtistItems(album.artistItems),
        ...metadata,
    };
}

function mapTrack(track: {
    id: string;
    name: string;
    albumId?: string | null;
    album?: string | null;
    albumArtist?: string | null;
    productionYear?: number | null;
    indexNumber?: number | null;
    parentIndexNumber?: number | null;
    runTimeTicks?: number | null;
    artistItems?: Array<{ id: string; name: string; metadataJson?: string | null }>;
    metadataJson?: string | null;
}): AlbumTrack {
    const metadata = track.metadataJson ? JSON.parse(track.metadataJson) : {};

    return {
        Id: track.id,
        Name: track.name,
        AlbumId: track.albumId || undefined,
        Album: track.album || undefined,
        AlbumArtist: track.albumArtist || undefined,
        ProductionYear: track.productionYear || undefined,
        IndexNumber: track.indexNumber || undefined,
        ParentIndexNumber: track.parentIndexNumber || undefined,
        RunTimeTicks: track.runTimeTicks || undefined,
        ArtistItems: mapArtistItems(track.artistItems),
        ...metadata,
    };
}

function mapPlaylist(playlist: {
    id: string;
    name: string;
    canDelete?: boolean;
    childCount?: number | null;
    metadataJson?: string | null;
}): Playlist {
    const metadata = playlist.metadataJson ? JSON.parse(playlist.metadataJson) : {};

    return {
        Id: playlist.id,
        Name: playlist.name,
        CanDelete: playlist.canDelete,
        ChildCount: playlist.childCount || undefined,
        ...metadata,
    };
}

export async function fetchAndStoreAllArtists(): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver, source } = driverResult;
    const artists = await fetchAllPages((offset, limit) => driver.getArtists({ offset, limit }));
    await upsertArtists(source.id, artists.map(mapArtist));
}

export async function fetchAndStoreAllAlbums(): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver, source } = driverResult;
    const albums = await fetchAllPages((offset, limit) => driver.getAlbums({ offset, limit }));
    await upsertAlbums(source.id, albums.map(mapAlbum));
}

export async function fetchAndStoreRecentAlbums(): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver, source } = driverResult;
    const albums = await driver.getRecentAlbums({ limit: 24 });
    await upsertAlbums(source.id, albums.map(mapAlbum));
}

export async function fetchAndStoreAllPlaylists(): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver, source } = driverResult;
    const playlists = await fetchAllPages((offset, limit) => driver.getPlaylists({ offset, limit }));
    await upsertPlaylists(source.id, playlists.map(mapPlaylist));
}

export async function fetchAndStoreAlbum(albumId: string): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver, source } = driverResult;
    const album = await driver.getAlbum(albumId);
    await upsertAlbum(source.id, mapAlbum(album));
}

export async function fetchAndStoreTracksByAlbum(albumId: string): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver, source } = driverResult;
    const tracks = await fetchAllPages((offset, limit) => driver.getTracksByAlbum(albumId, { offset, limit }));
    await upsertTracks(source.id, tracks.map(mapTrack));
}

export async function fetchAndStoreTracksByPlaylist(playlistId: string): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver, source } = driverResult;
    const tracks = await fetchAllPages((offset, limit) => driver.getTracksByPlaylist(playlistId, { offset, limit }));
    const mappedTracks = tracks.map(mapTrack);
    await upsertTracks(source.id, mappedTracks);
    await setPlaylistTracks(source.id, playlistId, mappedTracks.map((track) => track.Id));
}

export async function fetchAndStoreSimilarAlbums(albumId: string): Promise<void> {
    const driverResult = await getDriver();
    if (!driverResult) {
        return;
    }

    const { driver, source } = driverResult;
    const albums = await driver.getSimilarAlbums(albumId, { limit: 20 });
    const mapped = albums.map(mapAlbum);
    await upsertAlbums(source.id, mapped);
    await setSimilarAlbums(source.id, albumId, mapped.map((album) => album.Id));
}
