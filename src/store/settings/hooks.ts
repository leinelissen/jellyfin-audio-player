/**
 * Database-backed hooks for app settings
 */

import { useLiveQuery } from '@/store/live-queries';
import { db } from '@/store';

export function useAppSettings() {
    return useLiveQuery(() => db.query.settings.findFirst({ where: { id: 1 } }));
}
