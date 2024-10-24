import { AsyncThunkPayloadCreator, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { Album, AlbumTrack, CodecMetadata, Lyrics, Playlist } from './types';
import type { AsyncThunkAPI } from '..';
import { retrieveAllAlbums, retrieveRecentAlbums, retrieveAlbumTracks, retrieveAlbum, retrieveSimilarAlbums } from '@/utility/JellyfinApi/album';
import { retrieveAllPlaylists, retrievePlaylistTracks } from '@/utility/JellyfinApi/playlist';
import { searchItem } from '@/utility/JellyfinApi/search';
import { retrieveTrackLyrics } from '@/utility/JellyfinApi/lyrics';
import { retrieveTrackCodecMetadata } from '@/utility/JellyfinApi/track';

export const albumAdapter = createEntityAdapter<Album, string>({
    selectId: album => album.Id,
    sortComparer: (a, b) => a.Name.localeCompare(b.Name),
});

/**
 * Fetch lyrics for a given track
 */
export const fetchLyricsByTrack = createAsyncThunk<Lyrics, string, AsyncThunkAPI>(
    '/track/lyrics',
    retrieveTrackLyrics,
);

/**
 * Fetch codec metadata for a given track
 */
export const fetchCodecMetadataByTrack = createAsyncThunk<CodecMetadata, string, AsyncThunkAPI>(
    '/track/codecMetadata',
    retrieveTrackCodecMetadata,
);

/** A generic type for any action that retrieves tracks */
type AlbumTrackPayloadCreator = AsyncThunkPayloadCreator<AlbumTrack[], string, AsyncThunkAPI>;

/**
 * This is a wrapper that postprocesses any tracks, so that we can also support
 * lyrics, codec metadata and potential other applications.
 */
export const postProcessTracks = function(creator: AlbumTrackPayloadCreator): AlbumTrackPayloadCreator {
    // Return a new payload creator
    return async (args, thunkAPI) => {
        // Retrieve the tracks using the original creator
        const tracks = await creator(args, thunkAPI);

        // GUARD: Check if we've retrieved any tracks
        if (Array.isArray(tracks)) {
            // If so, attempt to retrieve lyrics for the tracks that have them
            tracks.filter((t) => t.HasLyrics)
                .forEach((t) => thunkAPI.dispatch(fetchLyricsByTrack(t.Id)));

            // Also, retrieve codec metadata
            tracks.forEach((t) => thunkAPI.dispatch(fetchCodecMetadataByTrack(t.Id)));
        }

        return tracks;
    };
};


/**
 * Fetch all albums available on the jellyfin server
 */
export const fetchAllAlbums = createAsyncThunk<Album[], undefined, AsyncThunkAPI>(
    '/albums/all',
    retrieveAllAlbums,
);

/**
 * Retrieve the most recent albums
 */
export const fetchRecentAlbums = createAsyncThunk<Album[], number | undefined, AsyncThunkAPI>(
    '/albums/recent',
    retrieveRecentAlbums,
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
    postProcessTracks(retrieveAlbumTracks),
);

export const fetchAlbum = createAsyncThunk<Album, string, AsyncThunkAPI>(
    '/albums/single',
    retrieveAlbum,
);

export const fetchSimilarAlbums = createAsyncThunk<Album[], string, AsyncThunkAPI>(
    '/albums/similar',
    retrieveSimilarAlbums,
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
        const results = await searchItem(term, limit);

        const albums = await Promise.all(results.filter((item) => (
            !state.music.albums.ids.includes(item.Type === 'MusicAlbum' ? item.Id : item.AlbumId)
            && (item.Type === 'Audio' ? item.AlbumId : true)
        )).map(async (item) => {
            if (item.Type === 'MusicAlbum') {
                return item;
            }

            return retrieveAlbum(item.AlbumId);
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
    retrieveAllPlaylists,
);

/**
 * Retrieve all tracks from a particular playlist
 */
export const fetchTracksByPlaylist = createAsyncThunk<AlbumTrack[], string, AsyncThunkAPI>(
    '/tracks/byPlaylist',
    postProcessTracks(retrievePlaylistTracks),
);
