# Data Source Drivers

This directory contains data source drivers for syncing media data from Jellyfin and Emby servers to the local SQLite database.

## Structure

- `jellyfin/` - Jellyfin server integration
- `emby/` - Emby server integration (placeholder with similar structure)
- `index.ts` - Main export file

## Usage

### Sync All Data

```typescript
import { syncAllFromServer } from '@/store/sources';
import { useTypedSelector } from '@/store';

// Get credentials from Redux store
const credentials = useTypedSelector((state) => state.settings.credentials);

if (credentials) {
  await syncAllFromServer(credentials.user_id, credentials.type);
}
```

### Sync Specific Resources

```typescript
import { jellyfin } from '@/store/sources';

// Sync only artists
await jellyfin.syncArtists(userId);

// Sync only albums
await jellyfin.syncAlbums(userId);

// Sync only tracks
await jellyfin.syncTracks(userId);

// Sync only playlists
await jellyfin.syncPlaylists(userId);

// Sync playlist items
await jellyfin.syncPlaylistItems(playlistId, userId);
```

### Fetch Data from API

```typescript
import { jellyfin } from '@/store/sources';

// Fetch with pagination
const albums = await jellyfin.fetchAlbums(userId, {
  offset: 0,
  limit: 50,
});

// Fetch artists
const artists = await jellyfin.fetchArtists(userId, {
  offset: 0,
  limit: 50,
});

// Fetch tracks
const tracks = await jellyfin.fetchTracks(userId, albumId, {
  offset: 0,
  limit: 100,
});
```

## Features

### Retry Logic

All API calls include automatic retry logic with exponential backoff:
- 5 retry attempts
- Initial delay: 100ms
- Backoff: exponential (100ms, 200ms, 400ms, 800ms, 1600ms)

### Pagination

API calls support pagination with renamed parameters:
- `offset` (maps to Jellyfin's `StartIndex`)
- `limit` (maps to Jellyfin's `Limit`)

### Error Handling

- Automatic retry on transient failures
- Clear error messages with context
- Detailed console logging in development mode

### Data Transformation

Sync functions handle:
- Denormalization (e.g., artist name in albums)
- Type conversion (e.g., RunTimeTicks to milliseconds)
- Foreign key resolution (artist_id, album_id)
- Conflict resolution (upsert based on jellyfin_id)

## Implementation Notes

### Jellyfin

Fully implemented with:
- Complete API client (`driver.ts`)
- Full sync functionality (`sync.ts`)
- Type definitions (`types.ts`)

### Emby

Placeholder implementation with:
- Similar API structure to Jellyfin
- Same type definitions
- Ready for extension when needed

Note: Emby uses very similar API endpoints to Jellyfin, so the implementation is largely compatible.

## Dependencies

- `@/utility/JellyfinApi/lib` - Base API client with authentication
- `@/store/database` - SQLite database with Drizzle ORM
- `drizzle-orm` - SQL query builder

## Database Schema

See `src/store/database/schema.ts` for the complete database schema. The sync functions transform API responses to match this schema.

### Key Tables

- `artists` - Music artists
- `albums` - Music albums (with denormalized artist name)
- `tracks` - Music tracks
- `playlists` - User playlists
- `playlist_tracks` - Playlist-track junction table
