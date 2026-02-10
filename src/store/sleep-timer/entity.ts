import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';

/**
 * Sleep timer - global sleep timer settings (single row, id=1)
 */
const sleepTimer = sqliteTable('sleep_timer', {
    id: integer('id').primaryKey().$default(() => 1),
    date: integer('date'), // nullable - epoch ms
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});

export default sleepTimer;
