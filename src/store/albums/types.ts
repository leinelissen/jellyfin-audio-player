/**
 * Album types
 */

import type { InferSelectModel } from 'drizzle-orm';
import albums from './entity';

export type Album = InferSelectModel<typeof albums>;
export type InsertAlbum = typeof albums.$inferInsert;
