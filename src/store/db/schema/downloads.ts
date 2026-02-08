import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sources } from './sources';

/**
 * Downloads table
 */
export const downloads = sqliteTable('downloads', {
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  id: text('id').primaryKey(),
  hash: text('hash'),
  filename: text('filename'),
  mimetype: text('mimetype'),
  progress: integer('progress'),
  isFailed: integer('is_failed', { mode: 'boolean' }).notNull(),
  isComplete: integer('is_complete', { mode: 'boolean' }).notNull(),
  metadataJson: text('metadata_json'), // JSON-encoded additional fields
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
