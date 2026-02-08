import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { sources } from './sources';

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
