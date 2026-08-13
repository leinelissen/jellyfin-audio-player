import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { jsonColumn } from '../database/column-types';
import sources from '../sources/entity';

/**
 * Playlists table
 */
const playlists = sqliteTable('playlists', {
    /** Foreign key to the source this playlist belongs to. */
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    /** Item ID assigned by the source. Used as the primary key. */
    id: text('id').primaryKey(),
    /** Display name of the playlist. */
    name: text('name').notNull(),
    /** Whether the current user is allowed to delete this playlist on the server. */
    canDelete: integer('can_delete', { mode: 'boolean' }).notNull(),
    /** Number of tracks in the playlist, if provided by the server. */
    childCount: integer('child_count'),
    /** Full source API response serialized as JSON, for fields not mapped to dedicated columns. */
    metadata: jsonColumn<unknown>('metadata'),
    /**
     * When this record was first synced from the server into the local database.
     * Set once on insert and never updated. Useful as a stable sort fallback.
     */
    firstSyncedAt: integer('first_synced_at').notNull().$defaultFn(() => Date.now()),
    /**
     * When this record was most recently synced from the server.
     * Set automatically on every insert and update — never set manually.
     */
    lastSyncedAt: integer('last_synced_at').notNull().$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()),
    /** When the playlist was created on the server. Null if the server did not provide it. */
    createdAt: integer('created_at'),
    /** When the playlist was last updated on the server. Null if the server did not provide it. */
    updatedAt: integer('updated_at'),
}, (table) => [
    index('playlists_source_name_idx').on(table.sourceId, table.name),
]);

export default playlists;