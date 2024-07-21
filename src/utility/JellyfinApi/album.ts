import { Album, AlbumTrack, SimilarAlbum } from '@/store/music/types';
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
    const Similar = await fetchApi<{ Items: SimilarAlbum[] }>(({ user_id }) => `/Items/${id}/Similar?userId=${user_id}&limit=12`)
        .then((albums) => albums!.Items.map((a) => a.Id));

    return fetchApi<Album>(({ user_id }) => `/Users/${user_id}/Items/${id}`)
        .then(album => ({ ...album!, Similar }));
}

const latestAlbumsOptions = {
    IncludeItemTypes: 'MusicAlbum',
    Fields: 'DateCreated',
    SortOrder: 'Ascending',
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
    return fetchApi<Album[]>(({ user_id }) => `/Users/${user_id}/Items/Latest?${params}`);
}

/**
 * Retrieve a single album from the Emby server
 */
export async function retrieveAlbumTracks(ItemId: string) {
    const singleAlbumOptions = {
        ParentId: ItemId,
        SortBy: 'SortName',
    };
    const singleAlbumParams = new URLSearchParams(singleAlbumOptions).toString();

    return fetchApi<{ Items: AlbumTrack[] }>(({ user_id }) => `/Users/${user_id}/Items?${singleAlbumParams}`)
        .then((data) => data!.Items);
}