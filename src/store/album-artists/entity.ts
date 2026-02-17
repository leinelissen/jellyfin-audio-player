import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
import sources from '../sources/entity';

/**
 * Album-Artists relation table (many-to-many)
 */
const albumArtists = sqliteTable('album_artists', {
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    albumId: text('album_id').notNull(),
    artistId: text('artist_id').notNull(),
    orderIndex: integer('order_index'),
}, (table) => [
    primaryKey({ columns: [table.sourceId, table.albumId, table.artistId] }),
    index('album_artists_source_artist_idx').on(table.sourceId, table.artistId),
]);

export default albumArtists;
