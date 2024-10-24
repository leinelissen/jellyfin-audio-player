import { Album, AlbumTrack } from '@/store/music/types';
import { fetchApi } from './lib';

const albumOptions = {
    SortBy: 'AlbumArtist,SortName',
    SortOrder: 'Ascending',
    IncludeItemTypes: 'MusicAlbum',
    Recursive: 'true',
    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
};

const albumParams = new URLSearchParams(albumOptions).toString();

/**
 * Retrieve all albums that are available on the Jellyfin server
 */
export async function retrieveAllAlbums() {
    return fetchApi<{ Items: Album[] }>(({ user_id }) => `/Users/${user_id}/Items?${albumParams}`)
        .then((data) => data!.Items);
}

/**
 * Retrieve a single album
 */
export async function retrieveAlbum(id: string): Promise<Album> {
    return fetchApi<Album>(({ user_id }) => `/Users/${user_id}/Items/${id}`);
}

/**
 * Retrieve albums that are similar to the provided album
 */
export async function retrieveSimilarAlbums(id: string): Promise<Album[]> {
    return fetchApi<{ Items: Album[] }>(({ user_id }) => `/Items/${id}/Similar?userId=${user_id}&limit=12`)
        .then((albums) => albums!.Items);
}

const latestAlbumsOptions = {
    IncludeItemTypes: 'MusicAlbum',
    Fields: 'DateCreated',
    SortOrder: 'Descending',
    SortBy: 'DateCreated',
    Recursive: 'true',
};

/**
 * Retrieve the most recently added albums on the Jellyfin server
 */
export async function retrieveRecentAlbums(numberOfAlbums = 24) {
    // Generate custom config based on function input
    const options = {
        ...latestAlbumsOptions,
        Limit: numberOfAlbums.toString(),
    };
    const params = new URLSearchParams(options).toString();

    // Retrieve albums
    return fetchApi<{ Items: Album[] }>(({ user_id }) => `/Users/${user_id}/Items?${params}`)
        .then((d) => d.Items);
}

/**
 * Retrieve a single album from the Emby server
 */
export async function retrieveAlbumTracks(ItemId: string) {
    const singleAlbumOptions = {
        ParentId: ItemId,
        SortBy: 'ParentIndexNumber,IndexNumber,SortName',
        Fields: 'MediaStreams',
    };
    const singleAlbumParams = new URLSearchParams(singleAlbumOptions).toString();

    return fetchApi<{ Items: AlbumTrack[] }>(({ user_id }) => `/Users/${user_id}/Items?${singleAlbumParams}`)
        .then((d) => d.Items);
}
