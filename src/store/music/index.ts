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
    fetchAlbum,
    setTimerDate
} from './actions';
import { createSlice, Dictionary, EntityId } from '@reduxjs/toolkit';
import { Album, AlbumTrack, Playlist } from './types';
import { setJellyfinCredentials } from '@/store/settings/actions';

export interface State {
    albums: {
        isLoading: boolean;
        entities: Dictionary<Album>;
        ids: EntityId[];
        lastRefreshed?: number,
    },
    tracks: {
        isLoading: boolean;
        entities: Dictionary<AlbumTrack>;
        ids: EntityId[];
        byAlbum: Dictionary<EntityId[]>;
        byPlaylist: Dictionary<EntityId[]>;
    },
    playlists: {
        isLoading: boolean;
        entities: Dictionary<Playlist>;
        ids: EntityId[];
        lastRefreshed?: number,
    },
    timerDate?: Date | null;
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
        byPlaylist: {},
    },
    playlists: {
        ...playlistAdapter.getInitialState(),
        isLoading: false,
    },
    timerDate: null
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
        
        // Reset any caches we have when a new server is set
        builder.addCase(setJellyfinCredentials, () => initialState);

        builder.addCase(setTimerDate, (state, action) => ({
            ...state,
            timerDate: action.payload,
        }));
    }
});

export default music;