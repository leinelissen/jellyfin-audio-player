import { MusicArtist } from '@/store/music/types';
import { fetchApi } from './lib';

const artistOptions = {
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    IncludeItemTypes: 'MusicArtist',
    Recursive: 'true',
    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
};

const artistParams = new URLSearchParams(artistOptions).toString();

/**
 * Retrieve all artists that are available on the Jellyfin server
 */
export function retrieveAllArtists() {
    return fetchApi<{ Items: MusicArtist[] }>(({ user_id }) => `/Users/${user_id}/Items?${artistParams}`)
        .then(response => response.Items);
}

export function retrieveArtistOverview(ItemId: string): Promise<string> {
    return fetchApi<{ Overview: string }>(({ user_id }) => `/Users/${user_id}/Items/${ItemId}`).then(response => response.Overview);
}
