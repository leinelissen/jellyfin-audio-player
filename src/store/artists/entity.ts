import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { jsonColumn } from '../database/column-types';
import sources from '../sources/entity';

/**
 * Artists table
 */
const artists = sqliteTable('artists', {
    /** Foreign key to the source this artist belongs to. */
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    /** Item ID assigned by the source — stable identifier used as the primary key. */
    id: text('id').primaryKey(),
    /** Display name of the artist. */
    name: text('name').notNull(),
    /** Full source API response serialized as JSON. Preserves all fields not mapped to dedicated columns. */
    metadata: jsonColumn<unknown>('metadata'),
    /**
     * Timestamp of when this record was first synced from the server (local time).
     * Set once on insert and never overwritten — use this as a stable sort fallback.
     */
    firstSyncedAt: integer('first_synced_at').notNull().$defaultFn(() => Date.now()),
    /**
     * Timestamp of the most recent sync that touched this record (local time).
     * Set automatically on every insert and update — never set manually.
     */
    lastSyncedAt: integer('last_synced_at').notNull().$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()),
    /** Server-reported creation date. Null if the server did not provide one. */
    createdAt: integer('created_at'),
    /** Server-reported last-modified date. Null if the server did not provide one. */
    updatedAt: integer('updated_at'),
}, (table) => [
    index('artists_source_name_idx').on(table.sourceId, table.name),
]);

export default artists;
