import { AlbumTrack, Playlist } from '@/store/music/types';
import { asyncFetchStore, fetchApi } from './lib';

const playlistOptions = {
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
    MediaTypes: 'Audio',
};

/**
 * Retrieve all albums that are available on the Jellyfin server
 */
export async function retrieveAllPlaylists() {
    const playlistParams = new URLSearchParams(playlistOptions).toString();
    
    return fetchApi<{ Items: Playlist[] }>(({ user_id }) => `/Users/${user_id}/Items?${playlistParams}`)
        .then((d) => d!.Items);
}

/**
 * Retrieve all albums that are available on the Jellyfin server
 */
export async function retrievePlaylistTracks(ItemId: string) {
    const credentials = asyncFetchStore().getState().settings.jellyfin;
    const singlePlaylistOptions = {
        SortBy: 'IndexNumber,SortName',
        UserId: credentials?.user_id || '',
    };
    const singlePlaylistParams = new URLSearchParams(singlePlaylistOptions).toString();

    return fetchApi<{ Items: AlbumTrack[] }>(`/Playlists/${ItemId}/Items?${singlePlaylistParams}`)
        .then((d) => d!.Items);
}