import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import sources from '../sources/entity';

/**
 * Sync cursors table - tracks prefill progress
 */
const syncCursors = sqliteTable('sync_cursors', {
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(), // 'artists', 'albums', 'tracks', 'playlists', etc.
    startIndex: integer('start_index').notNull(),
    pageSize: integer('page_size').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull(),
    updatedAt: integer('updated_at').notNull(),
}, (table) => [
    primaryKey({ columns: [table.sourceId, table.entityType] }),
]);

export default syncCursors;
