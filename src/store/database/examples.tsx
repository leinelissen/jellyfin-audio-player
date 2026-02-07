/**
 * Example usage of the Live Query system
 * 
 * This file demonstrates how to use the live query system in React components.
 * Copy these examples into your actual components as needed.
 */

import React from 'react';
import { View, Text, Button, FlatList, ActivityIndicator } from 'react-native';
import {
  useAlbums,
  useArtists,
  useTracks,
  usePlaylists,
  invalidateQueries,
  useLiveQuery,
  getDatabase,
  albums,
} from '@/store/database';
import type { Album } from '@/store/database';

/**
 * Example 1: Basic usage with useAlbums
 */
export function AlbumsListExample() {
  const { data: albumsList, isLoading, error, refetch } = useAlbums();

  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
        <Button title="Retry" onPress={refetch} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={albumsList || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.artist}</Text>
          </View>
        )}
      />
      <Button title="Refresh" onPress={refetch} />
    </View>
  );
}

/**
 * Example 2: Using useTracks with filter
 */
export function AlbumTracksExample({ albumId }: { albumId: number }) {
  const { data: tracks, isLoading } = useTracks(albumId);

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <FlatList
      data={tracks || []}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Text>{item.track_number}. {item.name}</Text>
          <Text>{formatDuration(item.duration)}</Text>
        </View>
      )}
    />
  );
}

/**
 * Example 3: Custom query with useLiveQuery
 */
export function RecentAlbumsExample() {
  const queryFn = React.useCallback(async () => {
    const db = await getDatabase();
    // Custom query - get most recent 20 albums
    const result = await db.query.albums.findMany({
      orderBy: (albumsTable, { desc }) => [desc(albumsTable.created_at)],
      limit: 20,
    });
    return result;
  }, []);

  const { data: recentAlbums, isLoading } = useLiveQuery<Album[]>(
    queryFn,
    ['recent-albums']
  );

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <FlatList
      data={recentAlbums || []}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
        </View>
      )}
    />
  );
}

/**
 * Example 4: Invalidating queries after mutation
 */
export function AddAlbumExample() {
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAddAlbum = async () => {
    setIsAdding(true);
    try {
      const db = await getDatabase();
      
      // Insert new album
      await db.insert(albums).values({
        name: 'New Album',
        artist: 'Artist Name',
        artist_id: 1,
        jellyfin_id: 'unique-id',
      });

      // Invalidate all album queries to trigger re-fetch
      invalidateQueries(/albums/);
      
      // Or invalidate all queries
      // invalidateQueries();
      
      // Or invalidate specific query
      // invalidateQueries('["albums"]');
      
    } catch (error) {
      console.error('Failed to add album:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      title={isAdding ? 'Adding...' : 'Add Album'}
      onPress={handleAddAlbum}
      disabled={isAdding}
    />
  );
}

/**
 * Example 5: Multiple queries in one component
 */
export function LibraryStatsExample() {
  const { data: albumsList } = useAlbums();
  const { data: artistsList } = useArtists();
  const { data: tracksList } = useTracks();
  const { data: playlistsList } = usePlaylists();

  return (
    <View>
      <Text>Library Statistics</Text>
      <Text>Albums: {albumsList?.length || 0}</Text>
      <Text>Artists: {artistsList?.length || 0}</Text>
      <Text>Tracks: {tracksList?.length || 0}</Text>
      <Text>Playlists: {playlistsList?.length || 0}</Text>
    </View>
  );
}

/**
 * Example 6: Advanced custom query with joins
 */
export function ArtistWithAlbumsExample({ artistId }: { artistId: number }) {
  const queryFn = React.useCallback(async () => {
    const db = await getDatabase();
    
    // Get artist with their albums
    const artist = await db.query.artists.findFirst({
      where: (artistsTable, { eq }) => eq(artistsTable.id, artistId),
      with: {
        albums: true,
      },
    });
    
    return artist;
  }, [artistId]);

  const { data: artist, isLoading } = useLiveQuery(
    queryFn,
    ['artist-with-albums', artistId]
  );

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (!artist) {
    return <Text>Artist not found</Text>;
  }

  return (
    <View>
      <Text>{artist.name}</Text>
      <Text>Albums:</Text>
      {/* Render albums */}
    </View>
  );
}

// Helper function
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
