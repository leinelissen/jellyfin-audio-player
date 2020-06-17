import { createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { Album, AlbumTrack } from './types';
import { AsyncThunkAPI } from '..';
import { retrieveAlbums, retrieveAlbumTracks } from '../../utility/JellyfinApi';

export const albumAdapter = createEntityAdapter<Album>({
    selectId: album => album.Id,
    sortComparer: (a, b) => a.Name.localeCompare(b.Name),
});

export const fetchAllAlbums = createAsyncThunk<Album[], undefined, AsyncThunkAPI>(
    '/albums/all',
    async (empty, thunkAPI) => {
        console.log('RETRIEVING ALBUMS');
        const credentials = thunkAPI.getState().settings.jellyfin;
        return retrieveAlbums(credentials) as Promise<Album[]>;
    }
);

export const trackAdapter = createEntityAdapter<AlbumTrack>({
    selectId: track => track.Id,
    sortComparer: (a, b) => a.IndexNumber - b.IndexNumber,
});

export const fetchTracksByAlbum = createAsyncThunk<AlbumTrack[], string, AsyncThunkAPI>(
    '/tracks/byAlbum',
    async (ItemId, thunkAPI) => {
        console.log('RETRIEVING ALBUMS');
        const credentials = thunkAPI.getState().settings.jellyfin;
        return retrieveAlbumTracks(ItemId, credentials) as Promise<AlbumTrack[]>;
    }
);