import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import sources from '../sources/entity';

/**
 * Sync cursors table - tracks sync progress per source, entity type, and optional parent entity.
 * The composite PK (sourceId, entityType, parentEntityId) allows independent cursors for
 * both top-level entities (parentEntityId = '') and dependent entities (e.g. tracks per album).
 */
const syncCursors = sqliteTable('sync_cursors', {
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    entityType: text('entity_type').notNull(),
    parentEntityId: text('parent_entity_id').notNull().default(''),
    parentEntityType: text('parent_entity_type').notNull().default(''),
    startIndex: integer('start_index').notNull(),
    pageSize: integer('page_size').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    attempts: integer('attempts').notNull().default(0),
    failedAt: integer('failed_at'),
    lastError: text('last_error'),
    updatedAt: integer('updated_at').notNull().$default(() => Date.now()).$onUpdate(() => Date.now()),
}, (table) => [
    primaryKey({ columns: [table.sourceId, table.entityType, table.parentEntityId] }),
]);

export default syncCursors;
