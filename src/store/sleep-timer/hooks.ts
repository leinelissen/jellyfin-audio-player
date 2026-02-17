import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import sleepTimer from './entity';
import { eq } from 'drizzle-orm';

export function useSleepTimer() {
    return useLiveQuery(
        db.query.sleepTimer.findFirst({
            where: eq(sleepTimer.id, 1),
        })
    );
}
