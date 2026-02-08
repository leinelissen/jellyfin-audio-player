import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sources } from '../db/schema/sources';

/**
 * Search queries table
 */
export const searchQueries = sqliteTable('search_queries', {
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    id: text('id').primaryKey(),
    query: text('query').notNull(),
    timestamp: integer('timestamp').notNull(),
    localPlaybackOnly: integer('local_playback_only', { mode: 'boolean' }).notNull(),
    metadataJson: text('metadata_json'), // JSON-encoded additional fields
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
}, (table) => ({
    sourceTimestampIdx: index('search_queries_source_timestamp_idx').on(table.sourceId, table.timestamp),
}));
