# Live Query System

A lightweight event-based query invalidation system for SQLite with React hooks, inspired by Gist.

## Features

- 🚀 **Simple API**: Easy-to-use React hooks for database queries
- 🔄 **Reactive Updates**: Components auto-update when data changes
- 🎯 **Manual Invalidation**: Trigger re-renders with `invalidateQueries()`
- 🧹 **Automatic Cleanup**: Queries clean up when components unmount
- 📦 **Lightweight**: No heavy dependencies, just Node.js Events

## Usage

### Basic Hooks

```typescript
import { useAlbums, useArtists, useTracks, usePlaylists } from '@/store/database';

// In your component
function AlbumsScreen() {
  const { data: albums, isLoading, error, refetch } = useAlbums();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return (
    <View>
      {albums?.map(album => (
        <AlbumCard key={album.id} album={album} />
      ))}
      <Button onPress={refetch}>Refresh</Button>
    </View>
  );
}

// Get tracks for a specific album
function AlbumDetails({ albumId }: { albumId: number }) {
  const { data: tracks } = useTracks(albumId);
  
  return (
    <View>
      {tracks?.map(track => (
        <TrackRow key={track.id} track={track} />
      ))}
    </View>
  );
}
```

### Custom Queries

```typescript
import { useLiveQuery, getDatabase } from '@/store/database';

function RecentAlbums() {
  const queryFn = useCallback(async () => {
    const db = await getDatabase();
    return db
      .select()
      .from(albums)
      .orderBy(desc(albums.created_at))
      .limit(10)
      .all();
  }, []);
  
  const { data: recentAlbums, isLoading } = useLiveQuery(queryFn, ['recent-albums']);
  
  return <AlbumList albums={recentAlbums} />;
}
```

### Invalidating Queries

After making database changes, invalidate queries to trigger updates:

```typescript
import { invalidateQueries, getDatabase } from '@/store/database';

async function addAlbum(albumData: NewAlbum) {
  const db = await getDatabase();
  
  // Insert album
  await db.insert(albums).values(albumData);
  
  // Invalidate all album-related queries
  invalidateQueries(/albums/);
  
  // Or invalidate specific query
  invalidateQueries('["albums"]');
  
  // Or invalidate all queries
  invalidateQueries();
}
```

### Pattern-Based Invalidation

```typescript
// Invalidate all track queries
invalidateQueries(/tracks/);

// Invalidate specific album's tracks
invalidateQueries('["tracks",123]');

// Invalidate everything
invalidateQueries();
```

## API Reference

### Hooks

#### `useAlbums()`
Returns all albums from the database.

**Returns**: `{ data, error, isLoading, refetch }`

#### `useArtists()`
Returns all artists from the database.

**Returns**: `{ data, error, isLoading, refetch }`

#### `useTracks(albumId?)`
Returns all tracks, optionally filtered by album ID.

**Parameters**:
- `albumId?: number` - Optional album ID to filter tracks

**Returns**: `{ data, error, isLoading, refetch }`

#### `usePlaylists()`
Returns all playlists from the database.

**Returns**: `{ data, error, isLoading, refetch }`

#### `useLiveQuery(queryFn, deps)`
Generic hook for custom queries.

**Parameters**:
- `queryFn: () => Promise<T>` - Async function that executes the query
- `deps: any[]` - Dependency array for cache key generation

**Returns**: `{ data, error, isLoading, refetch }`

### Functions

#### `invalidateQueries(keyOrPattern?)`
Invalidates and refetches queries.

**Parameters**:
- `keyOrPattern?: string | RegExp` - Optional query key or pattern
  - Omit to invalidate all queries
  - String to invalidate specific query
  - RegExp to invalidate queries matching pattern

**Example**:
```typescript
// Invalidate all
invalidateQueries();

// Invalidate albums
invalidateQueries(/albums/);

// Invalidate specific
invalidateQueries('["albums"]');
```

#### `createLiveQuery(key, queryFn)`
Creates a live query wrapper for manual execution.

**Parameters**:
- `key: string` - Unique query key
- `queryFn: () => Promise<T>` - Query function

**Returns**: `() => Promise<T>` - Wrapped query function

## Architecture

The system consists of three main components:

1. **LiveQueryManager**: Central registry that manages query state and subscriptions
2. **React Hooks**: Convenient hooks that subscribe components to queries
3. **Event System**: Node.js EventEmitter for efficient pub/sub

### How It Works

1. When a hook is called, it subscribes to a query with a unique key
2. The query executes and caches the result
3. Components using the hook automatically re-render when data changes
4. Call `invalidateQueries()` after mutations to trigger updates
5. Queries auto-cleanup when all subscribers unmount

## Best Practices

1. **Use deps array properly**: The dependency array determines cache key
   ```typescript
   // ✅ Good
   useLiveQuery(queryFn, ['tracks', albumId]);
   
   // ❌ Bad - will create new cache on every render
   useLiveQuery(queryFn, [Math.random()]);
   ```

2. **Memoize query functions**: Use `useCallback` for custom queries
   ```typescript
   const queryFn = useCallback(async () => {
     // query logic
   }, [dependencies]);
   ```

3. **Invalidate after mutations**: Always invalidate after DB changes
   ```typescript
   await db.insert(albums).values(data);
   invalidateQueries(/albums/);
   ```

4. **Use pattern matching**: Invalidate related queries efficiently
   ```typescript
   // After updating artist, invalidate artist and their albums
   invalidateQueries(/artists|albums/);
   ```

## Performance

- Queries are cached and shared between components
- Only re-executes when explicitly invalidated
- Automatic cleanup prevents memory leaks
- Supports 100+ concurrent queries by default
