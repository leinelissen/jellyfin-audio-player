/**
 * Database actions for sleep timer
 */

import { db, sqliteDb } from '@/store';
import sleepTimer from './entity';

export async function setSleepTimer(date: number | null): Promise<void> {
    const now = Date.now();

    await db.insert(sleepTimer).values({
        id: 1,
        date,
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: sleepTimer.id,
        set: {
            date,
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function clearSleepTimer(): Promise<void> {
    await setSleepTimer(null);
}
