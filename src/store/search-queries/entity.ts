import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { jsonColumn } from '../database/column-types';
import { randomUUID } from '../../utility/randomUUID';
import sources from '../sources/entity';

/**
 * Search queries table
 */
const searchQueries = sqliteTable('search_queries', {
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    query: text('query').notNull(),
    localPlaybackOnly: integer('local_playback_only', { mode: 'boolean' }).notNull(),
    metadata: jsonColumn<unknown>('metadata'),
    createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
}, (table) => [
    index('search_queries_source_timestamp_idx').on(table.sourceId, table.createdAt),
]);

export default searchQueries;
