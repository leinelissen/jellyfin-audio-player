/**
 * SearchQuery types
 */

import type { InferSelectModel } from 'drizzle-orm';
import searchQueries from './entity';

export type SearchQuery = InferSelectModel<typeof searchQueries>;
export type InsertSearchQuery = typeof searchQueries.$inferInsert;
