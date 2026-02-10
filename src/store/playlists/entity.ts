import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import sources from '../sources/entity';

/**
 * Playlists table
 */
const playlists = sqliteTable('playlists', {
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

export default playlists;
