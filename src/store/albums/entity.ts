import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import sources from '../sources/entity';

/**
 * Albums table
 */
const albums = sqliteTable('albums', {
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

export default albums;
