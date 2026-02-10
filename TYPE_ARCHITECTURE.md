# Type Architecture and Infrastructure

## Overview

This document explains the reorganized type architecture and restored infrastructure for the Jellyfin audio player.

## Type Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Response (PascalCase)                     │
│  JellyfinAlbum { Id, Name, ArtistItems: [{ Id, Name }] }       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Driver Transformation                          │
│  Transform PascalCase → camelCase + add metadataJson           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│             Schema-Compatible Type (camelCase)                   │
│  Album { id, name, metadataJson, artistItems: Artist[] }       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Insert                               │
│  db.insert(albums).values({ ...album, sourceId, timestamps })  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/store/
├── db/
│   ├── index.ts              # Database client (singleton export)
│   ├── types.ts              # Schema types (derived from Drizzle)
│   ├── live-queries.ts       # React hooks for reactive queries
│   ├── schema/
│   │   ├── artists.ts        # Artist table definition
│   │   ├── albums.ts         # Album table definition
│   │   ├── tracks.ts         # Track table definition
│   │   └── ...               # Other tables
│   └── migrations/
│       └── migrations.js     # Drizzle-generated migrations
│
├── sources/
│   ├── types.ts              # Base types using schema types
│   ├── jellyfin/
│   │   ├── driver.ts         # Jellyfin implementation
│   │   ├── types.ts          # Re-exports + Jellyfin types
│   │   └── api-types.ts      # Jellyfin API response types
│   └── emby/
│       ├── driver.ts         # Emby implementation
│       ├── types.ts          # Re-exports + Emby types
│       └── api-types.ts      # Emby API response types
│
└── prefill/
    ├── orchestrator.ts       # Main prefill orchestration
    └── task-graph.ts         # Dependent task execution
```

## Type Definitions

### 1. Schema Types (`db/types.ts`)

These are derived from the Drizzle schema using `InferSelectModel`:

```typescript
import type { InferSelectModel } from 'drizzle-orm';
import { albums } from './schema/albums';

export type Album = InferSelectModel<typeof albums>;
// Result: { id, sourceId, name, productionYear, isFolder, ..., createdAt, updatedAt }

export type InsertAlbum = typeof albums.$inferInsert;
// Used for inserts
```

### 2. API Response Types (`sources/*/api-types.ts`)

API types match the external API responses (PascalCase):

```typescript
// jellyfin/api-types.ts
export interface JellyfinAlbum {
    Id: string;
    Name: string;
    ProductionYear?: number;
    IsFolder: boolean;
    AlbumArtist?: string;
    DateCreated?: string;
    ArtistItems?: JellyfinArtist[];
}

export interface JellyfinItemsResponse<T> {
    Items: T[];
    TotalRecordCount: number;
    StartIndex: number;
}
```

### 3. Source Driver Types (`sources/types.ts`)

Driver return types are schema-compatible but exclude fields added at insert time:

```typescript
// Based on schema but without sourceId, timestamps
export type Album = Omit<SchemaAlbum, 'sourceId' | 'createdAt' | 'updatedAt' | 'lastRefreshed'> & {
    artistItems?: Artist[];  // Temporary field for relationships
};

// Driver methods return these types:
abstract class SourceDriver {
    abstract getAlbums(params?: ListParams): Promise<Album[]>;
}
```

## Driver Implementation Pattern

### Transformation Example

```typescript
async getAlbums(params?: ListParams): Promise<Album[]> {
    // 1. Fetch from API using API types
    const response = await this.fetch<JellyfinItemsResponse<JellyfinAlbum>>(url);

    // 2. Transform to schema-compatible format
    return response.Items.map(item => ({
        // Map PascalCase → camelCase
        id: item.Id,
        name: item.Name,
        productionYear: item.ProductionYear,
        isFolder: item.IsFolder || false,
        albumArtist: item.AlbumArtist,
        dateCreated: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
        
        // Store full API response as JSON
        metadataJson: JSON.stringify(item),
        
        // Transform nested relationships
        artistItems: item.ArtistItems?.map(artist => ({
            id: artist.Id,
            name: artist.Name,
            isFolder: artist.IsFolder,
            metadataJson: JSON.stringify(artist),
        })) || [],
    }));
}
```

### Database Insert Example

```typescript
const albums = await driver.getAlbums();
const now = Date.now();

await db.insert(albumsTable).values(
    albums.map(album => ({
        ...album,
        sourceId: 'source-123',  // Add sourceId
        createdAt: now,           // Add timestamps
        updatedAt: now,
    }))
).onConflictDoUpdate({
    target: [albumsTable.sourceId, albumsTable.id],
    set: {
        name: albums[0].name,
        // ... other fields
        updatedAt: now,
    },
});
```

## Prefill Infrastructure

### Orchestrator (`prefill/orchestrator.ts`)

Manages basic entity prefill with:
- **p-queue** for bounded concurrency (max 5 concurrent requests)
- **Cursor-based resume** via `sync_cursors` table
- **Progress callbacks** for UI updates

```typescript
const orchestrator = new PrefillOrchestrator(sourceId, driver, {
    concurrency: 5,
    pageSize: 500,
    onProgress: (progress) => {
        console.log(`${progress.entityType}: ${progress.totalFetched} items`);
    },
});

await orchestrator.runPrefill();
```

### Task Graph (`prefill/task-graph.ts`)

Handles dependent tasks that require parent entities:
- Album tracks (requires albums)
- Playlist tracks (requires playlists)
- Similar albums (optional)
- Lyrics (optional)

```typescript
const taskGraph = new PrefillTaskGraph(sourceId, driver, {
    concurrency: 5,
    onProgress: callback,
});

await taskGraph.runAllTasks();
```

## Live Queries (`db/live-queries.ts`)

React hooks for reactive database queries:

```typescript
// Hook that re-renders when albums table changes
const albums = useLiveQuery<Album>(
    'SELECT * FROM albums WHERE source_id = ? ORDER BY name',
    [sourceId],
    ['albums']  // Tables to watch
);

// Invalidate manually after inserts
await db.insert(albums).values(newAlbums);
invalidateTable('albums');
```

## Benefits

### Type Safety
- ✅ Compile-time errors if schema changes
- ✅ No confusion between API and internal types
- ✅ IntelliSense support throughout

### Maintainability
- ✅ API changes isolated to api-types.ts
- ✅ Schema changes propagate automatically
- ✅ Clear separation of concerns

### Flexibility
- ✅ Full API response preserved in `metadataJson`
- ✅ Can add computed fields at query time
- ✅ Easy to add new drivers

## Migration Path

When adding a new entity type:

1. **Define schema** in `db/schema/new-entity.ts`
2. **Add to db/types.ts** exports
3. **Update sources/types.ts** with driver return type
4. **Add API type** to `api-types.ts` (PascalCase)
5. **Implement driver method** with transformation
6. **Add to orchestrator** if needed for prefill

## Example: Adding a New Entity

```typescript
// 1. Schema (db/schema/genres.ts)
export const genres = sqliteTable('genres', {
    sourceId: text('source_id').notNull(),
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    metadataJson: text('metadata_json'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});

// 2. Export type (db/types.ts)
export type Genre = InferSelectModel<typeof genres>;

// 3. Driver type (sources/types.ts)
export type Genre = Omit<SchemaGenre, 'sourceId' | 'createdAt' | 'updatedAt'>;

// 4. API type (jellyfin/api-types.ts)
export interface JellyfinGenre {
    Id: string;
    Name: string;
}

// 5. Driver method (jellyfin/driver.ts)
async getGenres(): Promise<Genre[]> {
    const response = await this.fetch<JellyfinItemsResponse<JellyfinGenre>>('/Genres');
    return response.Items.map(item => ({
        id: item.Id,
        name: item.Name,
        metadataJson: JSON.stringify(item),
    }));
}
```

## Notes

- `metadataJson` field stores the complete API response for future extensibility
- `artistItems` is a temporary field on Album/Track types for relationship data
- Actual artist relationships are stored in separate junction tables
- Schema types are the source of truth for database structure
- API types document the external contracts
