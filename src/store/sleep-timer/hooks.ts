/**
 * Database-backed hooks for sleep timer
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import sleepTimer from './entity';
import { eq } from 'drizzle-orm';
import type { SleepTimer } from './types';

export function useSleepTimer() {
    const { data, error } = useLiveQuery(
        db.select().from(sleepTimer).where(eq(sleepTimer.id, 1)).limit(1)
    );
    
    return useMemo(() => ({
        data: data?.[0] as SleepTimer | undefined,
        error,
    }), [data, error]);
}
