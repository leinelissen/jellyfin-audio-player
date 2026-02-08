/**
 * Database-backed hooks for tracks with download joins
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { tracks } from './tracks';
import { downloads } from '@/store/downloads/downloads';
import { playlistTracks } from '@/store/db/schema/playlist-tracks';
import { eq, inArray } from 'drizzle-orm';
import type { Track } from './types';
import type { Download } from '@/store/downloads/types';

export interface TrackWithDownload {
    track: Track;
    download: Download | null;
}

export function useTracks(sourceId?: string) {
    const { data, error } = useLiveQuery(
        sourceId 
            ? db.select().from(tracks).where(eq(tracks.sourceId, sourceId))
            : db.select().from(tracks)
    );
    
    return useMemo(() => ({
        data: (data || []) as Track[],
        error,
    }), [data, error]);
}

export function useTrack(id: string) {
    const { data, error } = useLiveQuery(
        id ? db.select().from(tracks).where(eq(tracks.id, id)).limit(1) : null
    );
    
    return useMemo(() => ({
        data: data?.[0] as Track | undefined,
        error,
    }), [data, error]);
}

export function useTrackWithDownload(id: string) {
    const { data, error } = useLiveQuery(
        id 
            ? db.select({
                track: tracks,
                download: downloads,
            })
            .from(tracks)
            .leftJoin(downloads, eq(tracks.id, downloads.id))
            .where(eq(tracks.id, id))
            .limit(1)
            : null
    );
    
    return useMemo(() => {
        const result = data?.[0];
        return {
            data: result ? {
                track: result.track as Track,
                download: result.download as Download | null,
            } : undefined,
            error,
        };
    }, [data, error]);
}

export function useTracksByAlbum(albumId: string) {
    const { data, error } = useLiveQuery(
        albumId 
            ? db.select().from(tracks).where(eq(tracks.albumId, albumId))
            : null
    );
    
    return useMemo(() => ({
        data: (data || []) as Track[],
        error,
    }), [data, error]);
}

export function useTracksWithDownloadsByAlbum(albumId: string) {
    const { data, error } = useLiveQuery(
        albumId 
            ? db.select({
                track: tracks,
                download: downloads,
            })
            .from(tracks)
            .leftJoin(downloads, eq(tracks.id, downloads.id))
            .where(eq(tracks.albumId, albumId))
            : null
    );
    
    return useMemo(() => ({
        data: (data || []).map(row => ({
            track: row.track as Track,
            download: row.download as Download | null,
        })),
        error,
    }), [data, error]);
}

export function useTracksByPlaylist(playlistId: string) {
    const { data: relations, error: relError } = useLiveQuery(
        playlistId
            ? db.select().from(playlistTracks).where(eq(playlistTracks.playlistId, playlistId))
            : null
    );
    
    const trackIds = useMemo(() => (relations || []).map(r => r.trackId), [relations]);
    
    const { data: tracksData, error: tracksError } = useLiveQuery(
        trackIds.length > 0
            ? db.select().from(tracks).where(inArray(tracks.id, trackIds))
            : null
    );
    
    return useMemo(() => {
        const tracksMap = new Map((tracksData || []).map(t => [t.id, t as Track]));
        const sortedTracks = (relations || [])
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(r => tracksMap.get(r.trackId))
            .filter(Boolean) as Track[];
        
        return {
            data: sortedTracks,
            error: relError || tracksError,
        };
    }, [relations, tracksData, relError, tracksError]);
}

export function useTracksWithDownloadsByPlaylist(playlistId: string) {
    const { data: relations, error: relError } = useLiveQuery(
        playlistId
            ? db.select().from(playlistTracks).where(eq(playlistTracks.playlistId, playlistId))
            : null
    );
    
    const trackIds = useMemo(() => (relations || []).map(r => r.trackId), [relations]);
    
    const { data: tracksData, error: tracksError } = useLiveQuery(
        trackIds.length > 0
            ? db.select({
                track: tracks,
                download: downloads,
            })
            .from(tracks)
            .leftJoin(downloads, eq(tracks.id, downloads.id))
            .where(inArray(tracks.id, trackIds))
            : null
    );
    
    return useMemo(() => {
        const tracksMap = new Map((tracksData || []).map(row => [row.track.id, {
            track: row.track as Track,
            download: row.download as Download | null,
        }]));
        
        const sortedTracks = (relations || [])
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(r => tracksMap.get(r.trackId))
            .filter(Boolean) as TrackWithDownload[];
        
        return {
            data: sortedTracks,
            error: relError || tracksError,
        };
    }, [relations, tracksData, relError, tracksError]);
}
