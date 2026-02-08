import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
import { sources } from './sources';

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
