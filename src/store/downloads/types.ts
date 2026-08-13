/**
 * Download types
 */

import type { InferSelectModel } from 'drizzle-orm';
import downloads from './entity';

export type Download = InferSelectModel<typeof downloads> & {
	image?: string | null;
	location?: string | null;
	size?: number | null;
	error?: string | null;
};
export type InsertDownload = typeof downloads.$inferInsert;
