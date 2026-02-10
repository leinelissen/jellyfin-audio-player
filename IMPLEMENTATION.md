# SQLite Migration Implementation

This document describes the SQLite-based storage system implemented for Fintunes.

## Overview

The implementation provides a complete offline-first data storage solution using SQLite with:
- Schema-driven database design with proper indexing
- Live query support for reactive UI updates
- Unified driver interface for multiple source types (Jellyfin, Emby)
- Automated prefill system with bounded concurrency and cursor-based resume
- Proper error handling with automatic retries

## Architecture

### Database Layer (`src/store/db/`)

#### Schema (`schema.ts`)
Defines all database tables using Drizzle ORM:
- **sources**: Server connection information
- **app_settings**: Global application settings (single row)
- **sleep_timer**: Sleep timer state (single row)
- **artists, albums, tracks, playlists**: Media entities
- **downloads**: Download tracking
- **search_queries**: Search history
- **album_artists, track_artists, playlist_tracks**: Many-to-many relationships
- **album_similar**: Similar album recommendations
- **sync_cursors**: Prefill progress tracking

All updateable tables include `created_at` and `updated_at` timestamps. Most entity fields are stored in promoted columns for filtering/sorting, with additional metadata in `metadata_json`.

#### Client (`client.ts`)
Manages database connection and migrations:
- Singleton pattern for database instance
- Automatic table creation on first run
- Index creation for query performance
- Uses `@op-engineering/op-sqlite` as the SQLite driver

#### Live Queries (`live-queries.ts`)
Reactive query support based on table-level change notifications:
- `useLiveQuery()`: React hook for live data
- `useLiveQueryOne()`: Hook for single record
- `invalidateTable()`: Notify listeners of changes
- Manual invalidation after writes

**Caveats:**
- Table-level granularity (not row-level)
- Requires manual invalidation
- Not suitable for very large result sets

#### Helpers (`helpers.ts`)
Common database operations:
- `upsert()`: Insert or update with automatic timestamps
- `bulkUpsert()`: Efficient batch operations
- Entity-specific helpers (upsertArtist, upsertAlbum, etc.)
- Sync cursor management

### Source Drivers (`src/store/sources/`)

#### Types (`types.ts`)
Common interfaces and types:
- `SourceDriver`: Interface all drivers must implement
- `Source`: Source connection information
- `ListParams`: Paging parameters (offset, limit)
- Entity types: Artist, Album, Track, Playlist, etc.

#### Jellyfin Driver (`jellyfin/driver.ts`)
Complete Jellyfin API implementation:
- All list methods support paging (default 500 items per page)
- Proper authentication headers
- Error handling with typed errors
- Stream URL generation with platform-specific codecs
- Playback reporting

#### Emby Driver (`emby/driver.ts`)
Complete Emby API implementation:
- Same feature set as Jellyfin
- Different authentication header (`X-Emby-Authorization`)
- Compatible with Emby server API

### Prefill System (`src/store/prefill/`)

#### Orchestrator (`orchestrator.ts`)
Manages basic entity prefilling:
- Bounded concurrency (max 5 concurrent requests)
- Page size: 500 items
- Cursor-based resume support
- Automatic retry (up to 5 attempts with exponential backoff)
- Progress callbacks for UI updates

**Prefill order:**
1. Artists and Albums (parallel)
2. Playlists

#### Task Graph (`task-graph.ts`)
Handles dependent prefill tasks:
- Album tracks (requires albums)
- Playlist tracks (requires playlists)
- Similar albums (requires albums)
- Lyrics (requires tracks)

**Execution order:**
1. Album tracks and Playlist tracks (parallel)
2. Similar albums and Lyrics (parallel)

#### Main Coordinator (`index.ts`)
- `runPrefill()`: Execute complete prefill workflow
- Combines orchestrator and task graph
- Single function to prefill entire source

## Usage

### Initialize Database

```typescript
import { initializeDatabase } from '@/store/db';

// Initialize on app start
initializeDatabase();
```

### Create Source and Driver

```typescript
import { Source, SourceType, JellyfinDriver } from '@/store/sources';

const source: Source = {
  id: 'my-server-id',
  uri: 'https://jellyfin.example.com',
  userId: 'user-id',
  accessToken: 'access-token',
  deviceId: 'device-id',
  type: SourceType.JELLYFIN_V1,
};

const driver = new JellyfinDriver(source);
```

### Run Prefill

```typescript
import { runPrefill } from '@/store/prefill';

await runPrefill(source.id, driver, (progress) => {
  console.log(`${progress.entityType}: ${progress.totalFetched} items`);
  if (progress.completed) {
    console.log(`Completed: ${progress.entityType}`);
  }
});
```

### Query Data with Live Updates

```typescript
import { useLiveQuery } from '@/store/db';

function AlbumsList({ sourceId }: { sourceId: string }) {
  const albums = useLiveQuery(
    'SELECT * FROM albums WHERE source_id = ? ORDER BY name',
    [sourceId],
    ['albums']  // Tables to watch
  );

  if (!albums) return <Loading />;

  return (
    <View>
      {albums.map(album => (
        <AlbumItem key={album.id} album={album} />
      ))}
    </View>
  );
}
```

### Insert/Update Data

```typescript
import { upsertAlbum, invalidateTable } from '@/store/db';

await upsertAlbum({
  sourceId: 'my-server',
  id: 'album-123',
  name: 'New Album',
  isFolder: false,
  // ... other fields
});

// Manually invalidate to trigger live query updates
invalidateTable('albums');
```

## Testing

Basic smoke tests are provided in `src/store/db/__tests__/smoke.test.ts`:

```bash
npm test
```

Tests verify:
- Database initialization
- Entity upsert operations
- Sync cursor management

## Performance Considerations

### Indexes
All common query patterns are indexed:
- `artists(source_id, name)`
- `albums(source_id, name)`
- `albums(source_id, production_year)`
- `tracks(source_id, album_id)`
- `tracks(source_id, name)`
- `playlists(source_id, name)`
- Relationship tables by source and foreign keys

### Paging
All list endpoints support paging to avoid memory issues:
- Default page size: 500 items
- Configurable via `ListParams.limit`
- Offset-based pagination

### Concurrency
Prefill system limits concurrent requests:
- Max 5 concurrent API requests
- Prevents overwhelming the server
- Bounded memory usage

## Migration from Redux

The core infrastructure is complete. To fully migrate from Redux:

1. Replace Redux selectors with SQLite queries
2. Use `useLiveQuery` instead of Redux hooks
3. Replace Redux actions with direct DB operations
4. Remove Redux slices one by one
5. Update tests to use SQLite

## Next Steps

### Phase 4: Redux Removal
- [ ] Replace music slice with SQLite queries
- [ ] Replace settings slice with app_settings table
- [ ] Replace downloads slice with downloads table
- [ ] Replace search slice with search_queries table
- [ ] Replace sleep timer slice with sleep_timer table
- [ ] Update all components to use live queries

### Phase 5: Onboarding UI
- [ ] Wire prefill progress to onboarding screen
- [ ] Show entity counts and progress
- [ ] Handle errors gracefully
- [ ] Allow cancellation and retry

### Future Enhancements
- [ ] Incremental sync (only fetch changes)
- [ ] Background sync service
- [ ] Conflict resolution for multiple sources
- [ ] Query optimization based on usage patterns
- [ ] Database vacuum and optimization
- [ ] Export/import functionality

## Files Changed

### New Files
- `src/store/db/schema.ts` - Database schema
- `src/store/db/client.ts` - Database connection
- `src/store/db/live-queries.ts` - Live query support
- `src/store/db/helpers.ts` - Database helpers
- `src/store/db/index.ts` - Module exports
- `src/store/sources/types.ts` - Driver interfaces
- `src/store/sources/jellyfin/driver.ts` - Jellyfin driver
- `src/store/sources/emby/driver.ts` - Emby driver
- `src/store/sources/jellyfin/index.ts` - Jellyfin exports
- `src/store/sources/emby/index.ts` - Emby exports
- `src/store/sources/index.ts` - Sources exports
- `src/store/prefill/orchestrator.ts` - Prefill orchestrator
- `src/store/prefill/task-graph.ts` - Task graph
- `src/store/prefill/index.ts` - Prefill exports
- `src/store/db/__tests__/smoke.test.ts` - Basic tests

### Modified Files
- `package.json` - Added drizzle-orm, @op-engineering/op-sqlite, drizzle-kit
- `PLAN.md` - Updated progress tracker

## Dependencies Added

```json
{
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "@op-engineering/op-sqlite": "^15.2.5"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8"
  }
}
```

## License

Same as parent project.
