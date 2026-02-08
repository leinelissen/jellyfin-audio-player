/**
 * SearchQuery types
 */

import type { InferSelectModel } from 'drizzle-orm';
import { searchQueries } from './search-queries';

export type SearchQuery = InferSelectModel<typeof searchQueries>;
export type InsertSearchQuery = typeof searchQueries.$inferInsert;
