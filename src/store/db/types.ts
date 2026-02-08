/**
 * Database Schema Types
 * 
 * These types are derived from the Drizzle schema and represent
 * the structure of data in the database.
 */

import type { InferSelectModel } from 'drizzle-orm';
import { sources } from './schema/sources';
import { artists } from './schema/artists';
import { albums } from './schema/albums';
import { tracks } from './schema/tracks';
import { playlists } from './schema/playlists';
import { downloads } from './schema/downloads';
import { searchQueries } from './schema/search-queries';
import { albumArtists } from './schema/album-artists';
import { trackArtists } from './schema/track-artists';
import { playlistTracks } from './schema/playlist-tracks';
import { albumSimilar } from './schema/album-similar';
import { syncCursors } from './schema/sync-cursors';
import { appSettings } from './schema/app-settings';
import { sleepTimer } from './schema/sleep-timer';

/**
 * Inferred types from schema tables
 */
export type Source = InferSelectModel<typeof sources>;
export type Artist = InferSelectModel<typeof artists>;
export type Album = InferSelectModel<typeof albums>;
export type Track = InferSelectModel<typeof tracks>;
export type Playlist = InferSelectModel<typeof playlists>;
export type Download = InferSelectModel<typeof downloads>;
export type SearchQuery = InferSelectModel<typeof searchQueries>;
export type AlbumArtist = InferSelectModel<typeof albumArtists>;
export type TrackArtist = InferSelectModel<typeof trackArtists>;
export type PlaylistTrack = InferSelectModel<typeof playlistTracks>;
export type AlbumSimilar = InferSelectModel<typeof albumSimilar>;
export type SyncCursor = InferSelectModel<typeof syncCursors>;
export type AppSettings = InferSelectModel<typeof appSettings>;
export type SleepTimer = InferSelectModel<typeof sleepTimer>;

/**
 * Insert types (for creating new records)
 */
export type InsertSource = typeof sources.$inferInsert;
export type InsertArtist = typeof artists.$inferInsert;
export type InsertAlbum = typeof albums.$inferInsert;
export type InsertTrack = typeof tracks.$inferInsert;
export type InsertPlaylist = typeof playlists.$inferInsert;
export type InsertDownload = typeof downloads.$inferInsert;
export type InsertSearchQuery = typeof searchQueries.$inferInsert;
export type InsertAlbumArtist = typeof albumArtists.$inferInsert;
export type InsertTrackArtist = typeof trackArtists.$inferInsert;
export type InsertPlaylistTrack = typeof playlistTracks.$inferInsert;
export type InsertAlbumSimilar = typeof albumSimilar.$inferInsert;
export type InsertSyncCursor = typeof syncCursors.$inferInsert;
export type InsertAppSettings = typeof appSettings.$inferInsert;
export type InsertSleepTimer = typeof sleepTimer.$inferInsert;
