import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sources } from './sources';

/**
 * Artists table
 */
export const artists = sqliteTable('artists', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isFolder: integer('is_folder', { mode: 'boolean' }).notNull(),
  metadataJson: text('metadata_json'), // JSON-encoded additional fields
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  sourceNameIdx: index('artists_source_name_idx').on(table.sourceId, table.name),
}));
