import {
    fetchAllAlbums,
    albumAdapter,
    fetchTracksByAlbum,
    trackAdapter,
    fetchRecentAlbums,
    searchAndFetchAlbums,
    playlistAdapter,
    fetchAllPlaylists,
    fetchTracksByPlaylist,
    fetchAllTracks,
    fetchAlbum,
    fetchSimilarAlbums,
    fetchCodecMetadataByTrack,
    fetchLyricsByTrack
} from './actions';
import { createSlice } from '@reduxjs/toolkit';
import { Album, AlbumTrack, Playlist } from './types';
import { setJellyfinCredentials } from '@/store/settings/actions';

export interface State {
    albums: {
        isLoading: boolean;
        entities: Record<string, Album>;
        ids: string[];
        lastRefreshed?: number,
    },
    tracks: {
        isLoading: boolean;
        entities: Record<string, AlbumTrack>;
        ids: string[];
        byAlbum: Record<string, string[]>;
        byPlaylist: Record<string, string[]>;
    },
    playlists: {
        isLoading: boolean;
        entities: Record<string, Playlist>;
        ids: string[];
        lastRefreshed?: number,
    }
}

export const initialState: State = {
    albums: {
        ...albumAdapter.getInitialState(),
        isLoading: false,
    },
    tracks: {
        ...trackAdapter.getInitialState(),
        isLoading: false,
        byAlbum: {},
        byPlaylist: {}
    },
    playlists: {
        ...playlistAdapter.getInitialState(),
        isLoading: false,
    }
};

const music = createSlice({
    name: 'music',
    initialState,
    reducers: {
        reset: () => initialState,
    },
    extraReducers: builder => {
        /**
         * Fetch All albums
         */
        builder.addCase(fetchAllAlbums.fulfilled, (state, { payload }) => {
            albumAdapter.setAll(state.albums, payload);
            state.albums.isLoading = false;
            state.albums.lastRefreshed = new Date().getTime();
        });
        builder.addCase(fetchAllAlbums.pending, (state) => { state.albums.isLoading = true; });
        builder.addCase(fetchAllAlbums.rejected, (state) => { state.albums.isLoading = false; });

        /**
         * Fetch single album
         */
        builder.addCase(fetchAlbum.fulfilled, (state, { payload }) => {
            albumAdapter.upsertOne(state.albums, payload);
        });
        builder.addCase(fetchAlbum.pending, (state) => { state.albums.isLoading = true; });
        builder.addCase(fetchAlbum.rejected, (state) => { state.albums.isLoading = false; });
       
        /** 
         * Fetch similar albums
         */
        builder.addCase(fetchSimilarAlbums.fulfilled, (state, { payload, meta }) => {
            albumAdapter.upsertMany(state.albums, payload);
            state.albums.entities[meta.arg].Similar = payload.map((a) => a.Id);
        });

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
        builder.addCase(fetchTracksByAlbum.fulfilled, (state, { payload, meta }) => {
            if (!payload.length) {
                return;
            }

            trackAdapter.upsertMany(state.tracks, payload);

            // Also store all the track ids in the album
            state.tracks.byAlbum[meta.arg] = payload.map(d => d.Id);
            const album = state.albums.entities[meta.arg];
            if (album) {
                album.lastRefreshed = new Date().getTime();
            }
            state.tracks.isLoading = false;
        });
        builder.addCase(fetchTracksByAlbum.pending, (state) => { state.tracks.isLoading = true; });
        builder.addCase(fetchTracksByAlbum.rejected, (state) => { state.tracks.isLoading = false; });
        
        builder.addCase(searchAndFetchAlbums.pending, (state) => { state.albums.isLoading = true; });
        builder.addCase(searchAndFetchAlbums.fulfilled, (state, { payload }) => {
            albumAdapter.upsertMany(state.albums, payload.albums);
            state.albums.isLoading = false;
        });

        /**
         * Fetch all playlists
         */
        builder.addCase(fetchAllPlaylists.fulfilled, (state, { payload }) => {
            playlistAdapter.setAll(state.playlists, payload);
            state.playlists.isLoading = false;
            state.playlists.lastRefreshed = new Date().getTime();
        });
        builder.addCase(fetchAllPlaylists.pending, (state) => { state.playlists.isLoading = true; });
        builder.addCase(fetchAllPlaylists.rejected, (state) => { state.playlists.isLoading = false; });

        /**
         * Fetch tracks by playlist
         */
        builder.addCase(fetchTracksByPlaylist.fulfilled, (state, { payload, meta }) => {
            if (!payload.length) {
                return;
            }

            // Upsert the retrieved tracks
            trackAdapter.upsertMany(state.tracks, payload);

            // Also store all the track ids in the playlist
            state.tracks.byPlaylist[meta.arg] = payload.map(d => d.Id);
            state.tracks.isLoading = false;

            const playlist = state.playlists.entities[meta.arg];
            if (playlist) {
                playlist.lastRefreshed = new Date().getTime();
            }
        });
        builder.addCase(fetchTracksByPlaylist.pending, (state) => { state.tracks.isLoading = true; });
        builder.addCase(fetchTracksByPlaylist.rejected, (state) => { state.tracks.isLoading = false; });

        /**
         * Fetch all tracks
         */
         builder.addCase(fetchAllTracks.fulfilled, (state, { payload }) => {
            trackAdapter.setAll(state.tracks, payload);
            state.tracks.isLoading = false;
        });
        builder.addCase(fetchAllTracks.pending, (state) => { state.tracks.isLoading = true; });
        builder.addCase(fetchAllTracks.rejected, (state) => { state.tracks.isLoading = false; });
        
        // Reset any caches we have when a new server is set
        builder.addCase(setJellyfinCredentials, () => initialState);

        /**
         * Fetch track metadata
         */
        builder.addCase(fetchCodecMetadataByTrack.fulfilled, (state, { payload, meta }) => {
            state.tracks.entities[meta.arg].Codec = payload;
        });
        builder.addCase(fetchLyricsByTrack.fulfilled, (state, { payload, meta }) => {
            state.tracks.entities[meta.arg].Lyrics = payload;
        });
    }
});

export default music;