import { fetchAllAlbums, albumAdapter, fetchTracksByAlbum, trackAdapter } from './actions';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
        builder.addCase(fetchAllAlbums.fulfilled, (state, { payload }) => {
            albumAdapter.setAll(state.albums, payload);
            state.albums.isLoading = false;
        });
        builder.addCase(fetchAllAlbums.pending, (state) => { state.albums.isLoading = true; });
        builder.addCase(fetchAllAlbums.rejected, (state) => { state.albums.isLoading = false; });
        builder.addCase(fetchTracksByAlbum.fulfilled, (state, { payload }) => {
            trackAdapter.setAll(state.tracks, payload);

            // Also store all the track ids in the album
            const album = state.albums.entities[payload[0].AlbumId];
            if (album) {
                album.Tracks = payload.map(d => d.Id);
            }
            state.tracks.isLoading = false;
        });
        builder.addCase(fetchTracksByAlbum.pending, (state) => { state.tracks.isLoading = true; });
        builder.addCase(fetchTracksByAlbum.rejected, (state) => { state.tracks.isLoading = false; });
    }
});

export default music;