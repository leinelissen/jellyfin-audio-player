import { getDatabase } from './client';
import { invalidateTables } from './live-queries';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get current timestamp in epoch milliseconds
 */
export function now(): number {
  return Date.now();
}

/**
 * Upsert helper - insert or update with automatic timestamps
 */
export async function upsert<T extends Record<string, any>>(
  table: any,
  data: T,
  primaryKey: string | string[],
  tableName: string
): Promise<void> {
  const db = getDatabase();
  const timestamp = now();
  
  const dataWithTimestamps = {
    ...data,
    updatedAt: timestamp,
    createdAt: data.createdAt || timestamp,
  };

  // For drizzle-orm, we use INSERT with ON CONFLICT DO UPDATE
  // This is SQLite's UPSERT syntax
  await db.insert(table).values(dataWithTimestamps).onConflictDoUpdate({
    target: Array.isArray(primaryKey) 
      ? primaryKey.map(k => table[k])
      : [table[primaryKey]],
    set: dataWithTimestamps,
  });

  invalidateTables([tableName]);
}

/**
 * Bulk upsert - efficiently upsert multiple records
 */
export async function bulkUpsert<T extends Record<string, any>>(
  table: any,
  records: T[],
  primaryKey: string | string[],
  tableName: string
): Promise<void> {
  if (records.length === 0) return;

  const db = getDatabase();
  const timestamp = now();

  const recordsWithTimestamps = records.map(record => ({
    ...record,
    updatedAt: timestamp,
    createdAt: record.createdAt || timestamp,
  }));

  // Batch insert with ON CONFLICT
  await db.insert(table).values(recordsWithTimestamps).onConflictDoUpdate({
    target: Array.isArray(primaryKey)
      ? primaryKey.map(k => table[k])
      : [table[primaryKey]],
    set: recordsWithTimestamps[0], // Template for updates
  });

  invalidateTables([tableName]);
}

/**
 * Upsert artist
 */
export async function upsertArtist(artist: {
  sourceId: string;
  id: string;
  name: string;
  isFolder: boolean;
  metadataJson?: string;
}) {
  await upsert(schema.artists, artist, 'id', 'artists');
}

/**
 * Upsert album
 */
export async function upsertAlbum(album: {
  sourceId: string;
  id: string;
  name: string;
  productionYear?: number;
  isFolder: boolean;
  albumArtist?: string;
  dateCreated?: number;
  lastRefreshed?: number;
  metadataJson?: string;
}) {
  await upsert(schema.albums, album, 'id', 'albums');
}

/**
 * Upsert track
 */
export async function upsertTrack(track: {
  sourceId: string;
  id: string;
  name: string;
  albumId?: string;
  album?: string;
  albumArtist?: string;
  productionYear?: number;
  indexNumber?: number;
  parentIndexNumber?: number;
  hasLyrics?: boolean;
  runTimeTicks?: number;
  lyrics?: string;
  metadataJson?: string;
}) {
  await upsert(schema.tracks, track, 'id', 'tracks');
}

/**
 * Upsert playlist
 */
export async function upsertPlaylist(playlist: {
  sourceId: string;
  id: string;
  name: string;
  canDelete: boolean;
  childCount?: number;
  lastRefreshed?: number;
  metadataJson?: string;
}) {
  await upsert(schema.playlists, playlist, 'id', 'playlists');
}

/**
 * Upsert download
 */
export async function upsertDownload(download: {
  sourceId: string;
  id: string;
  hash?: string;
  filename?: string;
  mimetype?: string;
  progress?: number;
  isFailed: boolean;
  isComplete: boolean;
  metadataJson?: string;
}) {
  await upsert(schema.downloads, download, 'id', 'downloads');
}

/**
 * Upsert source
 */
export async function upsertSource(source: {
  id: string;
  uri: string;
  userId?: string;
  accessToken?: string;
  deviceId?: string;
  type: string;
}) {
  await upsert(schema.sources, source, 'id', 'sources');
}

/**
 * Upsert app settings (single row, id=1)
 */
export async function upsertAppSettings(settings: {
  bitrate: number;
  isOnboardingComplete: boolean;
  hasReceivedErrorReportingAlert: boolean;
  enablePlaybackReporting: boolean;
  colorScheme: string;
}) {
  await upsert(schema.appSettings, { ...settings, id: 1 }, 'id', 'app_settings');
}

/**
 * Upsert sleep timer (single row, id=1)
 */
export async function upsertSleepTimer(timer: {
  date?: number;
}) {
  await upsert(schema.sleepTimer, { ...timer, id: 1 }, 'id', 'sleep_timer');
}

/**
 * Upsert sync cursor
 */
export async function upsertSyncCursor(cursor: {
  sourceId: string;
  entityType: string;
  startIndex: number;
  pageSize: number;
  completed: boolean;
}) {
  const timestamp = now();
  await upsert(
    schema.syncCursors,
    { ...cursor, updatedAt: timestamp },
    ['sourceId', 'entityType'],
    'sync_cursors'
  );
}

/**
 * Get sync cursor for a source and entity type
 */
export async function getSyncCursor(sourceId: string, entityType: string) {
  const db = getDatabase();
  const result = await db
    .select()
    .from(schema.syncCursors)
    .where(
      and(
        eq(schema.syncCursors.sourceId, sourceId),
        eq(schema.syncCursors.entityType, entityType)
      )
    )
    .limit(1);
  
  return result[0] || null;
}

/**
 * Bulk upsert artists
 */
export async function bulkUpsertArtists(artists: Array<{
  sourceId: string;
  id: string;
  name: string;
  isFolder: boolean;
  metadataJson?: string;
}>) {
  await bulkUpsert(schema.artists, artists, 'id', 'artists');
}

/**
 * Bulk upsert albums
 */
export async function bulkUpsertAlbums(albums: Array<{
  sourceId: string;
  id: string;
  name: string;
  productionYear?: number;
  isFolder: boolean;
  albumArtist?: string;
  dateCreated?: number;
  lastRefreshed?: number;
  metadataJson?: string;
}>) {
  await bulkUpsert(schema.albums, albums, 'id', 'albums');
}

/**
 * Bulk upsert tracks
 */
export async function bulkUpsertTracks(tracks: Array<{
  sourceId: string;
  id: string;
  name: string;
  albumId?: string;
  album?: string;
  albumArtist?: string;
  productionYear?: number;
  indexNumber?: number;
  parentIndexNumber?: number;
  hasLyrics?: boolean;
  runTimeTicks?: number;
  lyrics?: string;
  metadataJson?: string;
}>) {
  await bulkUpsert(schema.tracks, tracks, 'id', 'tracks');
}

/**
 * Bulk upsert playlists
 */
export async function bulkUpsertPlaylists(playlists: Array<{
  sourceId: string;
  id: string;
  name: string;
  canDelete: boolean;
  childCount?: number;
  lastRefreshed?: number;
  metadataJson?: string;
}>) {
  await bulkUpsert(schema.playlists, playlists, 'id', 'playlists');
}
