import { createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { Album, AlbumTrack, Playlist } from './types';
import { AsyncThunkAPI } from '..';
import { retrieveAllAlbums, retrieveAlbumTracks, retrieveRecentAlbums, searchItem, retrieveAlbum, retrieveAllPlaylists, retrievePlaylistTracks } from '@/utility/JellyfinApi';

export const albumAdapter = createEntityAdapter<Album, string>({
    selectId: album => album.Id,
    sortComparer: (a, b) => a.Name.localeCompare(b.Name),
});

/**
 * Fetch all albums available on the jellyfin server
 */
export const fetchAllAlbums = createAsyncThunk<Album[], undefined, AsyncThunkAPI>(
    '/albums/all',
    async (empty, thunkAPI) => {
        const credentials = thunkAPI.getState().settings.jellyfin;
        return retrieveAllAlbums(credentials) as Promise<Album[]>;
    }
);

/**
 * Retrieve the most recent albums
 */
export const fetchRecentAlbums = createAsyncThunk<Album[], number | undefined, AsyncThunkAPI>(
    '/albums/recent',
    async (numberOfAlbums, thunkAPI) => {
        const credentials = thunkAPI.getState().settings.jellyfin;
        return retrieveRecentAlbums(credentials, numberOfAlbums) as Promise<Album[]>;
    }
);

export const trackAdapter = createEntityAdapter<AlbumTrack, string>({
    selectId: track => track.Id,
    sortComparer: (a, b) => a.IndexNumber - b.IndexNumber,
});

/**
 * Retrieve all tracks from a particular album
 */
export const fetchTracksByAlbum = createAsyncThunk<AlbumTrack[], string, AsyncThunkAPI>(
    '/tracks/byAlbum',
    async (ItemId, thunkAPI) => {
        const credentials = thunkAPI.getState().settings.jellyfin;
        return retrieveAlbumTracks(ItemId, credentials) as Promise<AlbumTrack[]>;
    }
);

export const fetchAlbum = createAsyncThunk<Album, string, AsyncThunkAPI>(
    '/albums/single',
    async (ItemId, thunkAPI) => {
        const credentials = thunkAPI.getState().settings.jellyfin;
        return retrieveAlbum(credentials, ItemId) as Promise<Album>;
    }
);

type SearchAndFetchResults = {
    albums: Album[];
    results: (Album | AlbumTrack)[]; 
};

export const searchAndFetchAlbums = createAsyncThunk<
SearchAndFetchResults,
{ term: string, limit?: number },
AsyncThunkAPI
>(
    '/search',
    async ({ term, limit = 24 }, thunkAPI) => {
        const state = thunkAPI.getState();
        const results = await searchItem(state.settings.jellyfin, term, limit);

        const albums = await Promise.all(results.filter((item) => (
            !state.music.albums.ids.includes(item.Type === 'MusicAlbum' ? item.Id : item.AlbumId)
            && (item.Type === 'Audio' ? item.AlbumId : true)
        )).map(async (item) => {
            if (item.Type === 'MusicAlbum') {
                return item;
            }

            return retrieveAlbum(state.settings.jellyfin, item.AlbumId);
        }));

        return {
            albums,
            results
        };
    }
);

export const playlistAdapter = createEntityAdapter<Playlist, string>({
    selectId: (playlist) => playlist.Id,
    sortComparer: (a, b) => a.Name.localeCompare(b.Name),
});

/**
 * Fetch all playlists available
 */
export const fetchAllPlaylists = createAsyncThunk<Playlist[], undefined, AsyncThunkAPI>(
    '/playlists/all',
    async (empty, thunkAPI) => {
        const credentials = thunkAPI.getState().settings.jellyfin;
        return retrieveAllPlaylists(credentials) as Promise<Playlist[]>;
    }
);

/**
 * Retrieve all tracks from a particular playlist
 */
export const fetchTracksByPlaylist = createAsyncThunk<AlbumTrack[], string, AsyncThunkAPI>(
    '/tracks/byPlaylist',
    async (ItemId, thunkAPI) => {
        const credentials = thunkAPI.getState().settings.jellyfin;
        return retrievePlaylistTracks(ItemId, credentials) as Promise<AlbumTrack[]>;
    }
);