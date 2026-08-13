import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { jsonColumn } from '../database/column-types';
import sources from '../sources/entity';

/**
 * Downloads table
 */
const downloads = sqliteTable('downloads', {
    sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
    id: text('id').primaryKey(),
    hash: text('hash'),
    filename: text('filename'),
    artworkPath: text('artwork_path'),
    mimetype: text('mimetype'),
    fileSize: integer('file_size'),
    progress: integer('progress'),
    isFailed: integer('is_failed', { mode: 'boolean' }).notNull(),
    isComplete: integer('is_complete', { mode: 'boolean' }).notNull(),
    metadata: jsonColumn<unknown>('metadata'),
    createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()),
});

export default downloads;
