import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { jsonColumn } from '../database/column-types';
import sources from '../sources/entity';

/**
 * Albums table
 */
const albums = sqliteTable('albums', {
    /** The source this album belongs to. */
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    /** Item ID assigned by the source — stable across syncs and used as the primary key. */
    id: text('id').primaryKey(),
    /** Display name of the album. */
    name: text('name').notNull(),
    /** Release year as reported by the server, if available. */
    productionYear: integer('production_year'),
    /** Primary album artist name as reported by the server, if available. */
    albumArtist: text('album_artist'),
    /** Full source API response serialised as JSON, for fields not mapped to dedicated columns. */
    metadata: jsonColumn<unknown>('metadata'),
    /**
     * Local timestamp (ms) of the first time this record was synced from the server.
     * Set once on insert and never updated — useful as a stable sort fallback.
     */
    firstSyncedAt: integer('first_synced_at').notNull().$defaultFn(() => Date.now()),
    /**
     * Local timestamp (ms) of the most recent sync that touched this record.
     * Set automatically on every insert and update.
     */
    lastSyncedAt: integer('last_synced_at').notNull().$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()),
    /**
     * Server-reported creation timestamp (ms), if provided by the source.
     * Null when the server does not supply this value. Used for sorting.
     */
    createdAt: integer('created_at'),
    /**
     * Server-reported last-modified timestamp (ms), if provided by the source.
     * Null when the server does not supply this value. Used for sorting.
     */
    updatedAt: integer('updated_at'),
}, (table) => [
    index('albums_source_name_idx').on(table.sourceId, table.name),
    index('albums_source_year_idx').on(table.sourceId, table.productionYear),
]);

export default albums;