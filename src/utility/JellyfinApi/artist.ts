import { MusicArtist } from '@/store/music/types';
import { fetchApi } from './lib';

const artistOptions = {
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    Recursive: 'true',
    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated,Overview',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
};

const artistParams = new URLSearchParams(artistOptions).toString();

/**
 * Retrieve all artists that are available on the Jellyfin server
 */
export function retrieveAllArtists() {
    return fetchApi<{ Items: MusicArtist[] }>(() => `/Artists/AlbumArtists?${artistParams}`)
        .then(response => response.Items);
}
