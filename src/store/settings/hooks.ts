/**
 * Database-backed hooks for app settings
 */

import { useMemo } from 'react';
import { useLiveQuery } from '@/store/db/live-queries';
import { db } from '@/store/db';
import { appSettings } from '@/store/db/schema/app-settings';
import { eq } from 'drizzle-orm';
import type { AppSettings } from '@/store/db/types';

export function useAppSettings() {
    const { data, error } = useLiveQuery(
        db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1)
    );
    
    return useMemo(() => ({
        data: data?.[0] as AppSettings | undefined,
        error,
    }), [data, error]);
}
