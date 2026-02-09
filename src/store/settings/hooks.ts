/**
 * Database-backed hooks for app settings
 */

import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import { eq } from 'drizzle-orm';
import settings from './entity';

export function useAppSettings() {
    const { data, error } = useLiveQuery(
        db.select().from(settings)
            .where(eq(settings.id, 1))
            .limit(1)
    );

    return { data: data?.[0], error };
}
