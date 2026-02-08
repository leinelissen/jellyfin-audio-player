import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sources } from '../db/schema/sources';

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
