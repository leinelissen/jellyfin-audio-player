import {
    fetchAllAlbums,
    albumAdapter,
    fetchTracksByAlbum,
    trackAdapter,
    fetchRecentAlbums,
    searchAndFetch,
    playlistAdapter,
    fetchAllPlaylists,
    fetchTracksByPlaylist,
    fetchAlbum,
    artistAdapter,
    fetchAllArtists,
    fetchInstantMixByTrackId,
    fetchSimilarAlbums,
    fetchCodecMetadataByTrack,
    fetchLyricsByTrack
} from './actions';
import { createSlice } from '@reduxjs/toolkit';
import { Album, AlbumTrack, Playlist, MusicArtist } from './types';

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
    },
    artists: {
        isLoading: boolean;
        entities: Record<string, MusicArtist>;
        ids: string[];
        lastRefreshed?: number;
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
        byPlaylist: {},
    },
    playlists: {
        ...playlistAdapter.getInitialState(),
        isLoading: false,
    },
    artists: {
        ...artistAdapter.getInitialState(),
        isLoading: false
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
        
        builder.addCase(searchAndFetch.pending, (state) => { 
            state.albums.isLoading = true;
            state.artists.isLoading = true;
            state.playlists.isLoading = true;
            state.tracks.isLoading = true;
        });
        builder.addCase(searchAndFetch.fulfilled, (state, { payload }) => {
            const albums = payload.filter(item => 
                item.Type === 'MusicAlbum' && !albumAdapter.getSelectors().selectById(state.albums, item.Id)
            ) as Album[];
            albumAdapter.upsertMany(state.albums, albums);
            state.albums.isLoading = false;

            const artists = payload.filter(item => 
                item.Type === 'MusicArtist' && !artistAdapter.getSelectors().selectById(state.artists, item.Id)
            ) as MusicArtist[];
            artistAdapter.upsertMany(state.artists, artists);
            state.artists.isLoading = false;

            const tracks = payload.filter(item => 
                item.Type === 'Audio' && !trackAdapter.getSelectors().selectById(state.tracks, item.Id)
            ) as AlbumTrack[];
            trackAdapter.upsertMany(state.tracks, tracks);
            state.tracks.isLoading = false;

            const playlists = payload.filter(item => 
                item.Type === 'Playlist' && !playlistAdapter.getSelectors().selectById(state.playlists, item.Id)
            ) as Playlist[];
            playlistAdapter.upsertMany(state.playlists, playlists);
            state.playlists.isLoading = false;
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
        
        builder.addCase(fetchInstantMixByTrackId.pending, state => { state.tracks.isLoading = true; });
        builder.addCase(fetchInstantMixByTrackId.rejected, state => { state.tracks.isLoading = false; });
        builder.addCase(fetchInstantMixByTrackId.fulfilled, (state, { payload }) => {
            const tracks = payload.filter(item => 
                !trackAdapter.getSelectors().selectById(state.tracks, item.Id)
            ) as AlbumTrack[];
            trackAdapter.upsertMany(state.tracks, tracks);

            state.tracks.isLoading = false;
        });

        // Reset any caches we have when a new server is set
        builder.addCase(setJellyfinCredentials, () => initialState);

        /**
         * Fetch All artists
         */
        builder.addCase(fetchAllArtists.fulfilled, (state, { payload }) => {
            artistAdapter.setAll(state.artists, payload);
            state.artists.isLoading = false;
            state.artists.lastRefreshed = new Date().getTime();
        });
        builder.addCase(fetchAllArtists.pending, (state) => { state.artists.isLoading = true; });
        builder.addCase(fetchAllArtists.rejected, (state) => { state.artists.isLoading = false; });
        
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
