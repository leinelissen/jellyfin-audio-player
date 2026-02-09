/**
 * Sleep Timer Database Operations
 * 
 * Replaces Redux store with direct database operations for sleep timer.
 */

import { db } from '../db/client';
import sleepTimer from './entity';
import { eq } from 'drizzle-orm';
import { invalidateTable } from '../live-queries';

const SLEEP_TIMER_ID = 1;

/**
 * Get the current sleep timer date
 */
export async function getSleepTimerDate(): Promise<number | null> {
    const result = await db
        .select()
        .from(sleepTimer)
        .where(eq(sleepTimer.id, SLEEP_TIMER_ID))
        .limit(1);

    return result[0]?.date ?? null;
}

/**
 * Set the sleep timer date
 */
export async function setSleepTimerDate(date: Date | null): Promise<void> {
    const now = Date.now();
    const dateValue = date?.getTime() ?? null;

    await db
        .insert(sleepTimer)
        .values({
            id: SLEEP_TIMER_ID,
            date: dateValue,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [sleepTimer.id],
            set: {
                date: dateValue,
                updatedAt: now,
            },
        });

    // Invalidate to trigger live query updates
    invalidateTable('sleep_timer');
}

/**
 * Clear the sleep timer
 */
export async function clearSleepTimer(): Promise<void> {
    await setSleepTimerDate(null);
}
