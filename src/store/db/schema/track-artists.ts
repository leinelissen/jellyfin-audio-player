import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
import { sources } from './sources';

/**
 * Track-Artists relation table (many-to-many)
 */
export const trackArtists = sqliteTable('track_artists', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  trackId: text('track_id').notNull(),
  artistId: text('artist_id').notNull(),
  orderIndex: integer('order_index'),
}, (table) => ({
  pk: primaryKey({ columns: [table.sourceId, table.trackId, table.artistId] }),
  sourceArtistIdx: index('track_artists_source_artist_idx').on(table.sourceId, table.artistId),
}));
