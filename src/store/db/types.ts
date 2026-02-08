/**
 * Database Schema Types
 * 
 * Re-exports types from entity modules for convenience
 */

export type { Album, InsertAlbum } from '../albums/types';
export type { Artist, InsertArtist } from '../artists/types';
export type { Track, InsertTrack } from '../tracks/types';
export type { Playlist, InsertPlaylist } from '../playlists/types';
export type { Download, InsertDownload } from '../downloads/types';
export type { SearchQuery, InsertSearchQuery } from '../search-queries/types';
export type { SleepTimer, InsertSleepTimer } from '../sleep-timer/types';

// Re-export relationship and other schema types
import type { InferSelectModel } from 'drizzle-orm';
import { sources } from './schema/sources';
import { albumArtists } from './schema/album-artists';
import { trackArtists } from './schema/track-artists';
import { playlistTracks } from './schema/playlist-tracks';
import { albumSimilar } from './schema/album-similar';
import { syncCursors } from './schema/sync-cursors';
import { appSettings } from './schema/app-settings';

export type Source = InferSelectModel<typeof sources>;
export type AlbumArtist = InferSelectModel<typeof albumArtists>;
export type TrackArtist = InferSelectModel<typeof trackArtists>;
export type PlaylistTrack = InferSelectModel<typeof playlistTracks>;
export type AlbumSimilar = InferSelectModel<typeof albumSimilar>;
export type SyncCursor = InferSelectModel<typeof syncCursors>;
export type AppSettings = InferSelectModel<typeof appSettings>;

export type InsertSource = typeof sources.$inferInsert;
export type InsertAlbumArtist = typeof albumArtists.$inferInsert;
export type InsertTrackArtist = typeof trackArtists.$inferInsert;
export type InsertPlaylistTrack = typeof playlistTracks.$inferInsert;
export type InsertAlbumSimilar = typeof albumSimilar.$inferInsert;
export type InsertSyncCursor = typeof syncCursors.$inferInsert;
export type InsertAppSettings = typeof appSettings.$inferInsert;
