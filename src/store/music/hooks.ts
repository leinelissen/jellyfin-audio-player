/**
 * Database-backed hooks for music data
 * These replace Redux selectors with live database queries
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { albums } from '@/store/db/schema/albums';
import { artists } from '@/store/db/schema/artists';
import { tracks } from '@/store/db/schema/tracks';
import { playlists } from '@/store/db/schema/playlists';
import { eq, desc } from 'drizzle-orm';
import { parseISO } from 'date-fns';
import { ALPHABET_LETTERS } from '@/CONSTANTS';
import type { SectionListData } from 'react-native';
import type { Album, AlbumTrack, MusicArtist, Playlist } from './types';

/**
 * Get all albums for a source
 */
export function useAlbums(sourceId: string) {
    const { data, error } = useLiveQuery(
        sourceId ? db.select().from(albums).where(eq(albums.sourceId, sourceId)) : null
    );
    
    return useMemo(() => {
        const albumsMap: Record<string, Album> = {};
        const ids: string[] = [];
        
        (data || []).forEach(album => {
            const enriched = enrichAlbum(album);
            albumsMap[enriched.Id] = enriched;
            ids.push(enriched.Id);
        });
        
        return { albums: albumsMap, ids, error, isLoading: false };
    }, [data, error]);
}

/**
 * Get recent albums (sorted by date created)
 */
export function useRecentAlbums(sourceId: string, amount: number = 24) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(albums).where(eq(albums.sourceId, sourceId)).orderBy(desc(albums.dateCreated)).limit(amount)
            : null
    );
    
    return useMemo(() => {
        const albumsMap: Record<string, Album> = {};
        const ids: string[] = [];
        
        (data || []).forEach(album => {
            const enriched = enrichAlbum(album);
            albumsMap[enriched.Id] = enriched;
            ids.push(enriched.Id);
        });
        
        return { albums: albumsMap, ids, error };
    }, [data, error]);
}

/**
 * Get albums sorted by alphabet with sections
 */
export function useAlbumsByAlphabet(sourceId: string) {
    const { albums: albumsMap, ids } = useAlbums(sourceId);
    
    return useMemo(() => {
        // Sort by album artist
        const sorted = [...ids].sort((a, b) => {
            const albumA = albumsMap[a];
            const albumB = albumsMap[b];
            if ((!albumA && !albumB) || (!albumA?.AlbumArtist && !albumB?.AlbumArtist)) {
                return 0;
            } else if (!albumA || !albumA.AlbumArtist) {
                return 1;
            } else if (!albumB || !albumB.AlbumArtist) {
                return -1;
            }
            return albumA.AlbumArtist.localeCompare(albumB.AlbumArtist);
        });
        
        // Split into alphabet sections
        const sections: SectionListData<string[]>[] = ALPHABET_LETTERS.split('').map((l) => ({ label: l, data: [[]] }));
        
        sorted.forEach((id) => {
            const album = albumsMap[id];
            const letter = album?.AlbumArtist?.toUpperCase().charAt(0);
            const index = letter ? ALPHABET_LETTERS.indexOf(letter) : 26;
            
            const section = sections[index >= 0 ? index : 26];
            const row = section.data.length - 1;
            
            section.data[row].push(id);
            
            if (section.data[row].length >= 2) {
                (section.data as string[][]).push([]);
            }
        });
        
        return sections;
    }, [albumsMap, ids]);
}

/**
 * Get all artists for a source
 */
export function useArtists(sourceId: string) {
    const { data, error } = useLiveQuery(
        sourceId ? db.select().from(artists).where(eq(artists.sourceId, sourceId)) : null
    );
    
    return useMemo(() => {
        const artistsMap: Record<string, MusicArtist> = {};
        const ids: string[] = [];
        
        (data || []).forEach(artist => {
            const enriched = enrichArtist(artist);
            artistsMap[enriched.Id] = enriched;
            ids.push(enriched.Id);
        });
        
        return { artists: artistsMap, ids, error };
    }, [data, error]);
}

/**
 * Get artists sorted by alphabet with sections
 */
export function useArtistsByAlphabet(sourceId: string) {
    const { artists: artistsMap } = useArtists(sourceId);
    
    return useMemo(() => {
        const artistsList = Object.values(artistsMap);
        const sections: SectionListData<MusicArtist>[] = ALPHABET_LETTERS.split('').map((l) => ({ label: l, data: [] }));
        
        artistsList.forEach((artist) => {
            const letter = artist.Name.toUpperCase().charAt(0);
            const index = letter ? ALPHABET_LETTERS.indexOf(letter) : 26;
            const section = sections[index >= 0 ? index : 26];
            (section.data as MusicArtist[]).push(artist);
        });
        
        return sections;
    }, [artistsMap]);
}

/**
 * Get all playlists for a source
 */
export function usePlaylists(sourceId: string) {
    const { data, error } = useLiveQuery(
        sourceId ? db.select().from(playlists).where(eq(playlists.sourceId, sourceId)) : null
    );
    
    return useMemo(() => {
        const playlistsMap: Record<string, Playlist> = {};
        const ids: string[] = [];
        
        (data || []).forEach(playlist => {
            const enriched = enrichPlaylist(playlist);
            playlistsMap[enriched.Id] = enriched;
            ids.push(enriched.Id);
        });
        
        return { playlists: playlistsMap, ids, error };
    }, [data, error]);
}

/**
 * Get tracks by album
 */
export function useTracksByAlbum(albumId: string) {
    const { data, error } = useLiveQuery(
        albumId ? db.select().from(tracks).where(eq(tracks.albumId, albumId)) : null
    );
    
    return useMemo(() => {
        const tracksMap: Record<string, AlbumTrack> = {};
        const ids: string[] = [];
        
        (data || []).forEach(track => {
            const enriched = enrichTrack(track);
            tracksMap[enriched.Id] = enriched;
            ids.push(enriched.Id);
        });
        
        return { tracks: tracksMap, ids, error };
    }, [data, error]);
}

/**
 * Get all tracks for a source
 */
export function useTracks(sourceId: string) {
    const { data, error } = useLiveQuery(
        sourceId ? db.select().from(tracks).where(eq(tracks.sourceId, sourceId)) : null
    );
    
    return useMemo(() => {
        const tracksMap: Record<string, AlbumTrack> = {};
        const ids: string[] = [];
        
        (data || []).forEach(track => {
            const enriched = enrichTrack(track);
            tracksMap[enriched.Id] = enriched;
            ids.push(enriched.Id);
        });
        
        return { tracks: tracksMap, ids, error };
    }, [data, error]);
}

/**
 * Helper functions to enrich database rows with full type information
 */

function enrichAlbum(dbAlbum: any): Album {
    const metadata = dbAlbum.metadataJson ? JSON.parse(dbAlbum.metadataJson) : {};
    return {
        Id: dbAlbum.id,
        Name: dbAlbum.name,
        ProductionYear: dbAlbum.productionYear,
        IsFolder: dbAlbum.isFolder,
        AlbumArtist: dbAlbum.albumArtist,
        DateCreated: dbAlbum.dateCreated ? new Date(dbAlbum.dateCreated).toISOString() : new Date().toISOString(),
        lastRefreshed: dbAlbum.lastRefreshed,
        ...metadata,
    };
}

function enrichArtist(dbArtist: any): MusicArtist {
    const metadata = dbArtist.metadataJson ? JSON.parse(dbArtist.metadataJson) : {};
    return {
        Id: dbArtist.id,
        Name: dbArtist.name,
        IsFolder: dbArtist.isFolder,
        ...metadata,
    };
}

function enrichTrack(dbTrack: any): AlbumTrack {
    const metadata = dbTrack.metadataJson ? JSON.parse(dbTrack.metadataJson) : {};
    const lyrics = dbTrack.lyrics ? JSON.parse(dbTrack.lyrics) : undefined;
    
    return {
        Id: dbTrack.id,
        Name: dbTrack.name,
        AlbumId: dbTrack.albumId,
        Album: dbTrack.album,
        AlbumArtist: dbTrack.albumArtist,
        ProductionYear: dbTrack.productionYear,
        IndexNumber: dbTrack.indexNumber,
        ParentIndexNumber: dbTrack.parentIndexNumber,
        HasLyrics: dbTrack.hasLyrics,
        RunTimeTicks: dbTrack.runTimeTicks,
        Lyrics: lyrics,
        ...metadata,
    };
}

function enrichPlaylist(dbPlaylist: any): Playlist {
    const metadata = dbPlaylist.metadataJson ? JSON.parse(dbPlaylist.metadataJson) : {};
    return {
        Id: dbPlaylist.id,
        Name: dbPlaylist.name,
        CanDelete: dbPlaylist.canDelete,
        ChildCount: dbPlaylist.childCount,
        lastRefreshed: dbPlaylist.lastRefreshed,
        ...metadata,
    };
}
