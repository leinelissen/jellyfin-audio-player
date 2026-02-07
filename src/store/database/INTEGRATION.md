# SQLite Database Integration

## Overview

The SQLite database has been integrated with the Redux store for caching and offline functionality. The database is automatically initialized when the app starts.

## Architecture

### Database Setup

The database is initialized in `src/store/index.ts` when the Redux store is created:

```typescript
import { initializeDatabaseSchema } from './database';

// After store creation
initializeDatabaseSchema()
    .then(() => {
        console.log('[Store] Database initialized successfully');
    })
    .catch((error) => {
        console.error('[Store] Database initialization failed:', error);
    });
```

### Key Features

1. **Automatic Schema Creation**: Tables are created automatically on first app launch
2. **Graceful Degradation**: App continues to work if database initialization fails
3. **Non-blocking**: Database initialization runs asynchronously without blocking app startup
4. **Backward Compatible**: Existing Redux functionality continues to work unchanged

## Database Schema

The database includes the following tables:

- **artists**: Music artist data with Jellyfin ID mapping
- **albums**: Album data with artist relationships
- **tracks**: Track data with album and artist relationships
- **playlists**: Playlist data
- **playlist_tracks**: Junction table for playlist-track relationships

## Using the Database

### Repositories

The database provides repositories for common operations:

```typescript
import { artistRepository, albumRepository, trackRepository, playlistRepository } from '@/store/database/repositories';

// Example: Fetch all albums
const albums = await albumRepository.getAll({ limit: 10, offset: 0 });

// Example: Get album by Jellyfin ID
const album = await albumRepository.getByJellyfinId('album-id-123');

// Example: Save track to database
await trackRepository.create({
  name: 'Track Name',
  album_id: 1,
  artist_id: 1,
  duration: 180000,
  track_number: 1,
  jellyfin_id: 'track-id-123',
  created_at: new Date(),
  updated_at: new Date(),
});
```

### Live Queries

For reactive updates, use the live query system:

```typescript
import { useLiveQuery } from '@/store/database';

// In a React component
const MyComponent = () => {
  const albums = useLiveQuery(
    async (db) => {
      return await albumRepository.getAll({ limit: 10 });
    },
    [], // Dependencies
    [] // Default value
  );
  
  return (
    <View>
      {albums.map(album => (
        <Text key={album.id}>{album.name}</Text>
      ))}
    </View>
  );
};
```

## Integration Points

### Current Redux Flow (Unchanged)

The existing Redux actions continue to work as before:

```typescript
import { fetchAllAlbums, fetchTracksByAlbum } from '@/store/music/actions';

// These still fetch from Jellyfin API and update Redux state
dispatch(fetchAllAlbums());
dispatch(fetchTracksByAlbum(albumId));
```

### Adding Database Caching (Future Enhancement)

To add database caching to existing actions, modify the action creators:

```typescript
// Example: Enhanced fetchAllAlbums with database caching
export const fetchAllAlbumsWithCache = createAsyncThunk(
  'music/fetchAllAlbumsWithCache',
  async (_, { dispatch, getState }) => {
    // 1. Try to get from database first
    const cachedAlbums = await albumRepository.getAll();
    
    if (cachedAlbums.length > 0) {
      // Return cached data immediately
      return cachedAlbums;
    }
    
    // 2. If not in database, fetch from API
    const albums = await retrieveAllAlbums();
    
    // 3. Save to database for offline access
    await Promise.all(
      albums.map(album => albumRepository.create(album))
    );
    
    return albums;
  }
);
```

## Error Handling

The database integration includes comprehensive error handling:

- Database connection failures are caught and logged
- Schema initialization errors don't crash the app
- Repository operations include try-catch blocks
- Errors are logged for debugging

## Performance Considerations

- Database operations are asynchronous and don't block the UI
- Indexes are created on commonly queried fields
- Pagination is supported for large datasets
- Live queries automatically update when data changes

## Next Steps

To fully leverage the database for offline functionality:

1. Add database caching to Redux actions
2. Implement offline-first data fetching strategy
3. Add sync logic to update database when connected to Jellyfin
4. Implement cache expiration and refresh logic
