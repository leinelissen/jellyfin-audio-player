import { fetchAllAlbums, albumAdapter, fetchTracksByAlbum, trackAdapter, fetchRecentAlbums } from './actions';
import { createSlice, Dictionary, EntityId } from '@reduxjs/toolkit';
import { Album, AlbumTrack } from './types';

export interface State {
    albums: {
        isLoading: boolean;
        entities: Dictionary<Album>;
        ids: EntityId[];
    },
    tracks: {
        isLoading: boolean;
        entities: Dictionary<AlbumTrack>;
        ids: EntityId[];
    },
    lastRefreshed?: number,
}

const initialState: State = {
    albums: {
        ...albumAdapter.getInitialState(),
        isLoading: false,
    },
    tracks: {
        ...trackAdapter.getInitialState(),
        isLoading: false,
    },
};

const music = createSlice({
    name: 'music',
    initialState,
    reducers: {},
    extraReducers: builder => {
        /**
         * Fetch All albums
         */
        builder.addCase(fetchAllAlbums.fulfilled, (state, { payload }) => {
            albumAdapter.setAll(state.albums, payload);
            state.albums.isLoading = false;
            state.lastRefreshed = new Date().getTime();
        });
        builder.addCase(fetchAllAlbums.pending, (state) => { state.albums.isLoading = true; });
        builder.addCase(fetchAllAlbums.rejected, (state) => { state.albums.isLoading = false; });
        
        /**
         * Fetch most recent albums
         */
        builder.addCase(fetchRecentAlbums.fulfilled, (state, { payload }) => {
            albumAdapter.upsertMany(state.albums, payload);
            state.albums.isLoading = false;
        });
        builder.addCase(fetchRecentAlbums.pending, (state) => { state.albums.isLoading = true; });
        builder.addCase(fetchRecentAlbums.rejected, (state) => { state.albums.isLoading = false; });
        
        /**
         * Fetch tracks by album
         */
        builder.addCase(fetchTracksByAlbum.fulfilled, (state, { payload }) => {
            trackAdapter.setAll(state.tracks, payload);

            // Also store all the track ids in the album
            const album = state.albums.entities[payload[0].AlbumId];
            if (album) {
                album.Tracks = payload.map(d => d.Id);
                album.lastRefreshed = new Date().getTime();
            }
            state.tracks.isLoading = false;
        });
        builder.addCase(fetchTracksByAlbum.pending, (state) => { state.tracks.isLoading = true; });
        builder.addCase(fetchTracksByAlbum.rejected, (state) => { state.tracks.isLoading = false; });
    }
});

export default music;