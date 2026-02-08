/**
 * Download types
 */

import type { InferSelectModel } from 'drizzle-orm';
import { downloads } from './downloads';

export type Download = InferSelectModel<typeof downloads>;
export type InsertDownload = typeof downloads.$inferInsert;
