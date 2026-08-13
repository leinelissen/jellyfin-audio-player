import { db } from '@/store';
import { eq } from 'drizzle-orm';
import sleepTimer from './entity';
import type { SleepTimer } from './types';

/**
 * Read the current sleep timer row from the database.
 * Returns null when no timer has been set yet.
 */
export async function getSleepTimer(): Promise<SleepTimer | null> {
    return await db.select().from(sleepTimer).where(eq(sleepTimer.id, 1)).get() ?? null;
}