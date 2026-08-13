import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { jsonColumn } from '../database/column-types';
import sources from '../sources/entity';
import type { TrackLyrics, TrackMetadata } from '../sources/types';

/**
 * Tracks table
 */
const tracks = sqliteTable('tracks', {
    /** Foreign key to the source this track belongs to. */
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    /** Item ID assigned by the source. */
    id: text('id').primaryKey(),
    /** Display name of the track. */
    name: text('name').notNull(),
    /** Item ID of the parent album as assigned by the source, if any. */
    albumId: text('album_id'),
    /** Display name of the parent album, if any. */
    album: text('album'),
    /** Display name of the album artist, if any. */
    albumArtist: text('album_artist'),
    /** Year the track was produced, if known. */
    productionYear: integer('production_year'),
    /** Track number within its disc/album, if known. */
    indexNumber: integer('index_number'),
    /** Disc number within the album, if known. */
    parentIndexNumber: integer('parent_index_number'),
    /** Duration of the track in ticks (1 tick = 100 nanoseconds), if known. */
    runTimeTicks: integer('run_time_ticks'),
    /** Cached lyrics, populated on demand. Stored as structured JSON. */
    lyrics: jsonColumn<TrackLyrics>('lyrics'),
    /** Full source API response serialised as JSON, for fields not promoted to dedicated columns. */
    metadata: jsonColumn<TrackMetadata>('metadata'),
    /**
     * When this record was first synced from the server locally. Set once on
     * insert and never updated — use for stable sorting when remote dates are absent.
     */
    firstSyncedAt: integer('first_synced_at').notNull().$defaultFn(() => Date.now()),
    /**
     * When this record was most recently synced from the server.
     * Set automatically on every insert and update — never set manually.
     */
    lastSyncedAt: integer('last_synced_at').notNull().$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()),
    /** Source-reported creation date. Null if the source did not provide one. */
    createdAt: integer('created_at'),
    /** Source-reported last-updated date. Null if the source did not provide one. */
    updatedAt: integer('updated_at'),
}, (table) => [
    index('tracks_source_album_idx').on(table.sourceId, table.albumId),
    index('tracks_source_name_idx').on(table.sourceId, table.name),
]);

export default tracks;