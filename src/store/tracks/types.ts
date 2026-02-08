/**
 * Track types
 */

import type { InferSelectModel } from 'drizzle-orm';
import { tracks } from './tracks';

export type Track = InferSelectModel<typeof tracks>;
export type InsertTrack = typeof tracks.$inferInsert;
