/**
 * Track types
 */

import type { InferSelectModel } from 'drizzle-orm';
import tracks from './entity';

export type Track = InferSelectModel<typeof tracks>;
export type InsertTrack = typeof tracks.$inferInsert;
