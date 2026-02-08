/**
 * Hook to get the current source ID from the database
 * Returns the first source's ID or an empty string if no source exists
 */
import { useLiveQuery } from './live-queries';
import { db } from './index';
import { sources } from './schema/sources';
import { useMemo } from 'react';

export function useSourceId(): string {
    const { data: sourceData } = useLiveQuery(db.select().from(sources).limit(1));
    
    return useMemo(() => {
        return (sourceData?.[0] as typeof sources.$inferSelect | undefined)?.id || '';
    }, [sourceData]);
}
