/**
 * Artist types
 */

import type { InferSelectModel } from 'drizzle-orm';
import { artists } from './artists';

export type Artist = InferSelectModel<typeof artists>;
export type InsertArtist = typeof artists.$inferInsert;
