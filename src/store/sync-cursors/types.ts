import type { InferSelectModel } from 'drizzle-orm';
import syncCursors from './entity';

export type SyncCursor = InferSelectModel<typeof syncCursors>;
export type InsertSyncCursor = typeof syncCursors.$inferInsert;

/**
 * All entity types that can be synced. These values are stored as-is in the
 * entity_type column of sync_cursors, so they must remain stable.
 *
 * Top-level entities (no parent): ARTISTS, ALBUMS, PLAYLISTS
 * Dependent entities (require a parentEntityId): ALBUM_TRACKS, PLAYLIST_TRACKS,
 *   SIMILAR_ALBUMS, LYRICS
 */
export enum EntityType {
    ARTISTS = 'artists',
    ALBUMS = 'albums',
    ALBUM_TRACKS = 'album_tracks',
    PLAYLISTS = 'playlists',
    PLAYLIST_TRACKS = 'playlist_tracks',
    SIMILAR_ALBUMS = 'similar_albums',
    LYRICS = 'lyrics',
}
