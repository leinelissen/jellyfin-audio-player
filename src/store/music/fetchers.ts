/**
 * Bridge functions to fetch from Jellyfin API and store in database
 * These replace the Redux thunks with direct database operations
 */

import { retrieveAllAlbums, retrieveRecentAlbums, retrieveAlbumTracks, retrieveAlbum, retrieveSimilarAlbums } from '@/utility/JellyfinApi/album';
import { retrieveAllPlaylists, retrievePlaylistTracks, retrieveInstantMixByTrackId } from '@/utility/JellyfinApi/playlist';
import { retrieveAllArtists } from '@/utility/JellyfinApi/artist';
import { searchItem } from '@/utility/JellyfinApi/search';
import { retrieveTrackLyrics } from '@/utility/JellyfinApi/lyrics';
import { retrieveTrackCodecMetadata } from '@/utility/JellyfinApi/track';
import { getActiveSource } from '@/store/settings/db';
import * as musicDb from './db';
import type { Album, AlbumTrack, MusicArtist, Playlist } from './types';

/**
 * Fetch all albums from Jellyfin and store in database
 */
export async function fetchAndStoreAllAlbums() {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const albums = await retrieveAllAlbums();
    await musicDb.upsertAlbums(source.id, albums);
    return albums;
}

/**
 * Fetch recent albums from Jellyfin and store in database
 */
export async function fetchAndStoreRecentAlbums() {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const albums = await retrieveRecentAlbums();
    await musicDb.upsertAlbums(source.id, albums);
    return albums;
}

/**
 * Fetch a single album from Jellyfin and store in database
 */
export async function fetchAndStoreAlbum(albumId: string) {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const album = await retrieveAlbum(albumId);
    await musicDb.upsertAlbum(source.id, album);
    return album;
}

/**
 * Fetch similar albums from Jellyfin and store in database
 */
export async function fetchAndStoreSimilarAlbums(albumId: string) {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const similarAlbums = await retrieveSimilarAlbums(albumId);
    await musicDb.upsertAlbums(source.id, similarAlbums);
    await musicDb.setSimilarAlbums(source.id, albumId, similarAlbums.map(a => a.Id));
    return similarAlbums;
}

/**
 * Fetch tracks by album from Jellyfin and store in database
 */
export async function fetchAndStoreTracksByAlbum(albumId: string) {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const tracks = await retrieveAlbumTracks(albumId);
    await musicDb.upsertTracks(source.id, tracks);

    // Fetch codec metadata and lyrics for tracks
    await Promise.all(tracks.map(async (track) => {
        if (track.HasLyrics) {
            try {
                const lyrics = await retrieveTrackLyrics(track.Id);
                track.Lyrics = lyrics;
                await musicDb.upsertTrack(source.id, track);
            } catch (e) {
                console.error('Error fetching lyrics for track', track.Id, e);
            }
        }
        
        try {
            const codec = await retrieveTrackCodecMetadata(track.Id);
            await musicDb.updateTrackCodec(track.Id, codec);
        } catch (e) {
            console.error('Error fetching codec for track', track.Id, e);
        }
    }));

    return tracks;
}

/**
 * Fetch all artists from Jellyfin and store in database
 */
export async function fetchAndStoreAllArtists() {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const artists = await retrieveAllArtists();
    await musicDb.upsertArtists(source.id, artists);
    return artists;
}

/**
 * Fetch all playlists from Jellyfin and store in database
 */
export async function fetchAndStoreAllPlaylists() {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const playlists = await retrieveAllPlaylists();
    await musicDb.upsertPlaylists(source.id, playlists);
    return playlists;
}

/**
 * Fetch tracks by playlist from Jellyfin and store in database
 */
export async function fetchAndStoreTracksByPlaylist(playlistId: string) {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const tracks = await retrievePlaylistTracks(playlistId);
    await musicDb.upsertTracks(source.id, tracks);
    await musicDb.setPlaylistTracks(source.id, playlistId, tracks.map(t => t.Id));

    // Fetch codec metadata and lyrics for tracks
    await Promise.all(tracks.map(async (track) => {
        if (track.HasLyrics) {
            try {
                const lyrics = await retrieveTrackLyrics(track.Id);
                track.Lyrics = lyrics;
                await musicDb.upsertTrack(source.id, track);
            } catch (e) {
                console.error('Error fetching lyrics for track', track.Id, e);
            }
        }
        
        try {
            const codec = await retrieveTrackCodecMetadata(track.Id);
            await musicDb.updateTrackCodec(track.Id, codec);
        } catch (e) {
            console.error('Error fetching codec for track', track.Id, e);
        }
    }));

    return tracks;
}

/**
 * Search Jellyfin and store results in database
 */
export async function searchAndStore(term: string) {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const results = await searchItem(term);
    
    // Separate results by type
    const albums = results.filter(item => item.Type === 'MusicAlbum') as Album[];
    const tracks = results.filter(item => item.Type === 'Audio') as AlbumTrack[];
    const artists = results.filter(item => item.Type === 'MusicArtist') as MusicArtist[];
    const playlists = results.filter(item => item.Type === 'Playlist') as Playlist[];

    // Store in database
    await Promise.all([
        musicDb.upsertAlbums(source.id, albums),
        musicDb.upsertTracks(source.id, tracks),
        musicDb.upsertArtists(source.id, artists),
        musicDb.upsertPlaylists(source.id, playlists),
    ]);

    return results;
}

/**
 * Fetch instant mix by track and store in database
 */
export async function fetchAndStoreInstantMixByTrack(trackId: string) {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');

    const tracks = await retrieveInstantMixByTrackId(trackId);
    await musicDb.upsertTracks(source.id, tracks);
    return tracks;
}
