import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Sources table - stores Jellyfin/Emby server connections
 */
export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  uri: text('uri').notNull(),
  userId: text('user_id'),
  accessToken: text('access_token'),
  deviceId: text('device_id'),
  type: text('type').notNull(), // 'jellyfin.v1' or 'emby.v1'
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
