import { useState, useEffect, useCallback, DependencyList } from 'react';
import { eq } from 'drizzle-orm';
import { getDatabase } from './connection';
import { artists, albums, tracks, playlists } from './schema';
import type { Artist, Album, Track, Playlist } from './schema';
import { liveQueryManager, QueryFn } from './live-query';

/**
 * Generic hook for live queries with automatic re-rendering
 */
export function useLiveQuery<T>(
  queryFn: QueryFn<T>,
  deps: DependencyList = []
): {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const [, forceUpdate] = useState({});
  
  // Create stable query key from deps
  const queryKey = JSON.stringify(deps);

  // Force component re-render
  const trigger = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    // Subscribe to query updates
    const unsubscribe = liveQueryManager.subscribe(queryKey, queryFn, trigger);

    return () => {
      unsubscribe();
    };
  }, [queryKey, queryFn, trigger]);

  // Get current state
  const state = liveQueryManager.getQueryState<T>(queryKey);

  // Manual refetch function
  const refetch = useCallback(() => {
    liveQueryManager.invalidateQueries(queryKey);
  }, [queryKey]);

  return {
    ...state,
    refetch,
  };
}

/**
 * Hook to get all albums
 */
export function useAlbums(): {
  data: Album[] | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const queryFn = useCallback(async () => {
    const db = await getDatabase();
    return db.select().from(albums).all();
  }, []);

  return useLiveQuery(queryFn, ['albums']);
}

/**
 * Hook to get all artists
 */
export function useArtists(): {
  data: Artist[] | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const queryFn = useCallback(async () => {
    const db = await getDatabase();
    return db.select().from(artists).all();
  }, []);

  return useLiveQuery(queryFn, ['artists']);
}

/**
 * Hook to get tracks, optionally filtered by album
 */
export function useTracks(
  albumId?: number
): {
  data: Track[] | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const queryFn = useCallback(async () => {
    const db = await getDatabase();
    
    if (albumId !== undefined) {
      return db.select().from(tracks).where(eq(tracks.album_id, albumId)).all();
    }
    
    return db.select().from(tracks).all();
  }, [albumId]);

  return useLiveQuery(queryFn, ['tracks', albumId]);
}

/**
 * Hook to get all playlists
 */
export function usePlaylists(): {
  data: Playlist[] | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const queryFn = useCallback(async () => {
    const db = await getDatabase();
    return db.select().from(playlists).all();
  }, []);

  return useLiveQuery(queryFn, ['playlists']);
}
