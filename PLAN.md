# SQLite Migration + Prefill Plan

Date: 2026-02-08

## Goals
- Remove Redux entirely and move all state into SQLite for performance and simplicity.
- Support multiple sources (Jellyfin/Emby) with a unified driver interface.
- Make SQLite the primary, offline-first source of truth.
- Prefill the database by crawling all sources with paging, bounded concurrency, and resume support.

## Current State Summary
- Redux slices: settings, music (albums, tracks, playlists, artists), downloads, search, sleep timer.
- Jellyfin API utilities fetch full lists without paging (except small limits on search, recent, instant mix).
- No existing prefill framework or cursor state.

## Implementation Decisions (2026-02-08 updates)
- No existing SQLite code; start from scratch.
- Use the live query shim from https://gist.github.com/dukedorje/7154ab0601e4f9cc1f337e0010168bf8.
- Use drizzle-kit for schema/migrations and @op-engineering/op-sqlite as the SQLite driver.
- Drivers live under /store/sources/{jellyfin,emby}.
- Source type enum values are hardcoded: `jellyfin.v1` and `emby.v1`.
- Rename paging params to offset and limit in drivers, then translate to API params.
- Lyrics and similar album endpoints already exist in the repo; reuse them.
- Error handling: retry up to 5 times, then permanently fail.
- Extend onboarding progress UI in screens/Onboarding.

## Data Model (Filter-Only + metadata_json)
- Promote only fields used for filtering/sorting.
- Store all remaining entity fields in metadata_json (TEXT, JSON-encoded).
- No metadata_json table. No metadata_json on settings.
- Add created_at and updated_at (epoch ms) on updateable tables.
- Rename server to source throughout schema.
- Add explicit lyrics column on tracks and album_similar relation table.
- Downloads include hash, filename, mimetype.
- No sort_name columns anywhere.
- app_settings and sleep_timer are global, no source_id.

### Tables
- sources
  - id (pk), uri, user_id, access_token, device_id, type, created_at, updated_at
  - nullable: user_id, access_token, device_id

- app_settings
  - id (pk, fixed = 1), bitrate, is_onboarding_complete, has_received_error_reporting_alert,
    enable_playback_reporting, color_scheme, created_at, updated_at
  - nullable: none

- sleep_timer
  - id (pk, fixed = 1), date, created_at, updated_at
  - nullable: date

- artists
  - source_id, id (pk), name, is_folder, metadata_json, created_at, updated_at
  - nullable: metadata_json

- albums
  - source_id, id (pk), name, production_year, is_folder, album_artist,
    date_created, last_refreshed, metadata_json, created_at, updated_at
  - nullable: production_year, album_artist, date_created, last_refreshed, metadata_json

- tracks
  - source_id, id (pk), name, album_id, album, album_artist, production_year,
    index_number, parent_index_number, has_lyrics, run_time_ticks, lyrics,
    metadata_json, created_at, updated_at
  - nullable: album_id, album, album_artist, production_year, index_number,
    parent_index_number, run_time_ticks, lyrics, metadata_json

- playlists
  - source_id, id (pk), name, can_delete, child_count, last_refreshed,
    metadata_json, created_at, updated_at
  - nullable: child_count, last_refreshed, metadata_json

- downloads
  - source_id, id (pk), hash, filename, mimetype, progress, is_failed, is_complete,
    metadata_json, created_at, updated_at
  - nullable: hash, filename, mimetype, progress, metadata_json

- search_queries
  - source_id, id (pk), query, timestamp, local_playback_only, metadata_json,
    created_at, updated_at
  - nullable: metadata_json

- album_artists
  - source_id, album_id, artist_id, order_index
  - nullable: order_index

- track_artists
  - source_id, track_id, artist_id, order_index
  - nullable: order_index

- playlist_tracks
  - source_id, playlist_id, track_id, position
  - nullable: position

- album_similar
  - source_id, album_id, similar_album_id

- sync_cursors
  - source_id, entity_type, start_index, page_size, completed, updated_at
  - nullable: none

### Indexes
- artists(source_id, name)
- albums(source_id, name)
- albums(source_id, production_year)
- tracks(source_id, album_id)
- tracks(source_id, name)
- playlists(source_id, name)
- playlist_tracks(source_id, playlist_id, position)
- track_artists(source_id, artist_id)
- album_artists(source_id, artist_id)
- search_queries(source_id, timestamp DESC)

## Driver Interface (Source Injected)
- Constructor takes Source object; methods operate on that source.
- Key methods:
  - connect, refreshCredentials, validateCredentials, signOut
  - getArtists, getAlbums, getAlbum, getTracksByAlbum
  - getPlaylists, getPlaylist, getTracksByPlaylist
  - search, getRecentAlbums, getSimilarAlbums, getInstantMix(entityId)
  - getTrackCodecMetadata, getTrackLyrics
  - getStreamUrl, getDownloadInfo
  - reportPlaybackStart, reportPlaybackProgress, reportPlaybackStop

### TypeScript Interface (Driver)
```ts
export interface SourceDriver {
    connect(): Promise<SourceInfo>;
    refreshCredentials(): Promise<Credentials>;
    validateCredentials(): Promise<boolean>;
    signOut(): Promise<void>;

    getArtists(params?: ListParams): Promise<Artist[]>;
    getAlbums(params?: ListParams): Promise<Album[]>;
    getAlbum(albumId: string): Promise<Album>;
    getTracksByAlbum(albumId: string, params?: ListParams): Promise<Track[]>;

    getPlaylists(params?: ListParams): Promise<Playlist[]>;
    getPlaylist(playlistId: string): Promise<Playlist>;
    getTracksByPlaylist(playlistId: string, params?: ListParams): Promise<Track[]>;

    search(query: string, filters: SearchFilter[], params?: ListParams): Promise<SearchResultItem[]>;
    getRecentAlbums(params?: ListParams): Promise<Album[]>;
    getSimilarAlbums(albumId: string, params?: ListParams): Promise<Album[]>;
    getInstantMix(entityId: string, params?: ListParams): Promise<Track[]>;

    getTrackCodecMetadata(trackId: string): Promise<CodecMetadata | null>;
    getTrackLyrics(trackId: string): Promise<Lyrics | null>;

    getStreamUrl(trackId: string, options?: StreamOptions): Promise<string>;
    getDownloadInfo(trackId: string, options?: DownloadOptions): Promise<DownloadInfo>;

    reportPlaybackStart(trackId: string, positionTicks: number): Promise<void>;
    reportPlaybackProgress(trackId: string, positionTicks: number): Promise<void>;
    reportPlaybackStop(trackId: string, positionTicks: number): Promise<void>;
}
```

## API Paging Updates
- Rewrite all Jellyfin/Emby API wrappers into their respective drivers.
- Add paging support to driver methods for list endpoints:
  - getAlbums, getArtists, getTracks, getPlaylists, getTracksByAlbum, getTracksByPlaylist
- Parameters: startIndex, limit
- Default limit = 500

## Prefill Framework
- Orchestrator runs for each source and writes pages directly to SQLite.
- Concurrency: max 5 requests.
- Page size: 500.
- Resume: sync_cursors per source + entity type.

### Prefill Order
1. Artists
2. Albums
3. Tracks
4. Playlists
5. Album tracks
6. Playlist tracks
7. Similar albums
8. Lyrics

### Behavior
- Fetch a page, upsert into SQLite, discard page data to keep memory flat.
- Enqueue dependent tasks only after parent entities exist.
- Update sync_cursors after each page.
- Continue until no items returned; mark completed.

## Testing and Validation
- Smoke test: single source, verify counts and basic queries.
- Resume test: interrupt prefill, restart, confirm cursor resume.
- Paging test: compare page 1 and page 2 IDs for non-overlap.
- Query performance: verify common sorts and filters are indexed.

## Open Questions / Follow-ups
- Decide if relation tables need timestamps (currently omitted).
- Confirm all UI filters map to promoted columns.
- Verify Emby endpoints and paging parameters match Jellyfin behavior.

## Additional Required Work
- Replace all Redux reads/writes with SQLite queries (use live queries where feasible).
- Update onboarding UI to display progress during the initial prefill.
- Move all new database-related code under /store.

## Subagent Work Breakdown
- Schema + migrations: tables, indexes, and migration scripts.
- SQLite access layer: DB setup, query helpers, upsert patterns, timestamps.
- Live queries: integrate shim and document caveats.
- Driver interfaces + types: shared Source types, ListParams, filter models.
- Jellyfin driver: rewrite APIs, add paging (offset/limit), map fields.
- Emby driver: rewrite APIs, add paging (offset/limit), map fields.
- Prefill orchestrator: bounded concurrency, cursor resume, upsert pipeline.
- Prefill task graph: dependent tasks for album/playlist tracks, similar, lyrics.
- Redux removal: replace selectors/actions with SQLite queries and live updates.
- Onboarding progress UI: wire prefill progress and error states.
- Tests: smoke, resume, paging non-overlap, index performance.

## Subagent Progress Tracker (Boilerplate)

Legend: NOT STARTED | IN PROGRESS | BLOCKED | DONE

| Area | Owner | Status | Notes |
| --- | --- | --- | --- |
| Schema + migrations | AI | DONE | Created schema.ts with all tables and indexes per spec |
| SQLite access layer | AI | DONE | Created client.ts with DB init, migrations, and query helpers |
| Live queries shim | AI | DONE | Created live-queries.ts with reactive query support |
| Driver interfaces + types | AI | DONE | Created types.ts with Source, Driver interface, and all entity types |
| Jellyfin driver | AI | DONE | Created complete Jellyfin driver with all methods and paging support |
| Emby driver | AI | DONE | Created complete Emby driver with all methods and paging support |
| Prefill orchestrator | AI | DONE | Created orchestrator with bounded concurrency, cursor resume, and error handling |
| Prefill task graph | AI | DONE | Created task graph for album/playlist tracks, similar albums, and lyrics |
| Redux removal | | NOT STARTED | |
| Onboarding progress UI | | NOT STARTED | |
| Tests | | NOT STARTED | |
