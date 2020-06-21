import { createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { Album, AlbumTrack } from './types';
import { AsyncThunkAPI } from '..';
import { retrieveAlbums, retrieveAlbumTracks, retrieveRecentAlbums } from 'utility/JellyfinApi';

export const albumAdapter = createEntityAdapter<Album>({
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
        return retrieveAlbums(credentials) as Promise<Album[]>;
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

export const trackAdapter = createEntityAdapter<AlbumTrack>({
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