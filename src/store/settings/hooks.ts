/**
 * Database-backed hooks for app settings
 */

import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';
import { eq } from 'drizzle-orm';
import settings from './entity';

export function useAppSettings() {
    return useLiveQuery(
        db.query.settings.findFirst({
            where: eq(settings.id, 1),
        })
    );
}
