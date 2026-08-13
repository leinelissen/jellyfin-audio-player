/**
 * SleepTimer types
 */

import type { InferSelectModel } from 'drizzle-orm';
import sleepTimer from './entity';

export type SleepTimer = InferSelectModel<typeof sleepTimer>;
export type InsertSleepTimer = typeof sleepTimer.$inferInsert;
