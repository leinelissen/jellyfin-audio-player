import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';

/**
 * Sources table - stores Jellyfin/Emby server connections
 */
export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  uri: text('uri').notNull(),
  userId: text('user_id'),
  accessToken: text('access_token'),
  deviceId: text('device_id'),
  type: text('type').notNull(), // 'jellyfin.v1' or 'emby.v1'
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * App settings - global application settings (single row, id=1)
 */
export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey().$default(() => 1),
  bitrate: integer('bitrate').notNull(),
  isOnboardingComplete: integer('is_onboarding_complete', { mode: 'boolean' }).notNull(),
  hasReceivedErrorReportingAlert: integer('has_received_error_reporting_alert', { mode: 'boolean' }).notNull(),
  enablePlaybackReporting: integer('enable_playback_reporting', { mode: 'boolean' }).notNull(),
  colorScheme: text('color_scheme').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Sleep timer - global sleep timer settings (single row, id=1)
 */
export const sleepTimer = sqliteTable('sleep_timer', {
  id: integer('id').primaryKey().$default(() => 1),
  date: integer('date'), // nullable - epoch ms
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Artists table
 */
export const artists = sqliteTable('artists', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isFolder: integer('is_folder', { mode: 'boolean' }).notNull(),
  metadataJson: text('metadata_json'), // JSON-encoded additional fields
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  sourceNameIdx: index('artists_source_name_idx').on(table.sourceId, table.name),
}));

/**
 * Albums table
 */
export const albums = sqliteTable('albums', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  productionYear: integer('production_year'),
  isFolder: integer('is_folder', { mode: 'boolean' }).notNull(),
  albumArtist: text('album_artist'),
  dateCreated: integer('date_created'),
  lastRefreshed: integer('last_refreshed'),
  metadataJson: text('metadata_json'), // JSON-encoded additional fields
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  sourceNameIdx: index('albums_source_name_idx').on(table.sourceId, table.name),
  sourceYearIdx: index('albums_source_year_idx').on(table.sourceId, table.productionYear),
}));

/**
 * Tracks table
 */
export const tracks = sqliteTable('tracks', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  albumId: text('album_id'),
  album: text('album'),
  albumArtist: text('album_artist'),
  productionYear: integer('production_year'),
  indexNumber: integer('index_number'),
  parentIndexNumber: integer('parent_index_number'),
  hasLyrics: integer('has_lyrics', { mode: 'boolean' }).notNull().default(false),
  runTimeTicks: integer('run_time_ticks'),
  lyrics: text('lyrics'),
  metadataJson: text('metadata_json'), // JSON-encoded additional fields
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  sourceAlbumIdx: index('tracks_source_album_idx').on(table.sourceId, table.albumId),
  sourceNameIdx: index('tracks_source_name_idx').on(table.sourceId, table.name),
}));

/**
 * Playlists table
 */
export const playlists = sqliteTable('playlists', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  canDelete: integer('can_delete', { mode: 'boolean' }).notNull(),
  childCount: integer('child_count'),
  lastRefreshed: integer('last_refreshed'),
  metadataJson: text('metadata_json'), // JSON-encoded additional fields
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  sourceNameIdx: index('playlists_source_name_idx').on(table.sourceId, table.name),
}));

/**
 * Downloads table
 */
export const downloads = sqliteTable('downloads', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  id: text('id').primaryKey(),
  hash: text('hash'),
  filename: text('filename'),
  mimetype: text('mimetype'),
  progress: integer('progress'),
  isFailed: integer('is_failed', { mode: 'boolean' }).notNull(),
  isComplete: integer('is_complete', { mode: 'boolean' }).notNull(),
  metadataJson: text('metadata_json'), // JSON-encoded additional fields
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Search queries table
 */
export const searchQueries = sqliteTable('search_queries', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  id: text('id').primaryKey(),
  query: text('query').notNull(),
  timestamp: integer('timestamp').notNull(),
  localPlaybackOnly: integer('local_playback_only', { mode: 'boolean' }).notNull(),
  metadataJson: text('metadata_json'), // JSON-encoded additional fields
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  sourceTimestampIdx: index('search_queries_source_timestamp_idx').on(table.sourceId, table.timestamp),
}));

/**
 * Album-Artists relation table (many-to-many)
 */
export const albumArtists = sqliteTable('album_artists', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  albumId: text('album_id').notNull(),
  artistId: text('artist_id').notNull(),
  orderIndex: integer('order_index'),
}, (table) => ({
  pk: primaryKey({ columns: [table.sourceId, table.albumId, table.artistId] }),
  sourceArtistIdx: index('album_artists_source_artist_idx').on(table.sourceId, table.artistId),
}));

/**
 * Track-Artists relation table (many-to-many)
 */
export const trackArtists = sqliteTable('track_artists', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  trackId: text('track_id').notNull(),
  artistId: text('artist_id').notNull(),
  orderIndex: integer('order_index'),
}, (table) => ({
  pk: primaryKey({ columns: [table.sourceId, table.trackId, table.artistId] }),
  sourceArtistIdx: index('track_artists_source_artist_idx').on(table.sourceId, table.artistId),
}));

/**
 * Playlist-Tracks relation table (many-to-many with position)
 */
export const playlistTracks = sqliteTable('playlist_tracks', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  playlistId: text('playlist_id').notNull(),
  trackId: text('track_id').notNull(),
  position: integer('position'),
}, (table) => ({
  pk: primaryKey({ columns: [table.sourceId, table.playlistId, table.trackId] }),
  sourcePlaylistPositionIdx: index('playlist_tracks_source_playlist_position_idx').on(table.sourceId, table.playlistId, table.position),
}));

/**
 * Album-Similar relation table (for similar albums)
 */
export const albumSimilar = sqliteTable('album_similar', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  albumId: text('album_id').notNull(),
  similarAlbumId: text('similar_album_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.sourceId, table.albumId, table.similarAlbumId] }),
}));

/**
 * Sync cursors table - tracks prefill progress
 */
export const syncCursors = sqliteTable('sync_cursors', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(), // 'artists', 'albums', 'tracks', 'playlists', etc.
  startIndex: integer('start_index').notNull(),
  pageSize: integer('page_size').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.sourceId, table.entityType] }),
}));
