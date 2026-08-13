import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';

export function useSleepTimer() {
    return useLiveQuery(() => db.query.sleepTimer.findFirst({ where: { id: 1 } }));
}