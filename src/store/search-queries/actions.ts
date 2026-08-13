/**
 * Database actions for search queries
 */

import { db, sqliteDb } from '@/store';
import searchQueries from './entity';
import { and, eq } from 'drizzle-orm';
import type { InsertSearchQuery } from './types';
import type { EntityId } from '@/store/types';

export async function upsertSearchQuery(query: InsertSearchQuery): Promise<void> {
    await db.insert(searchQueries).values({
        ...query,
    }).onConflictDoUpdate({
        target: searchQueries.id,
        set: {
            ...query,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteSearchQuery([sourceId, id]: EntityId): Promise<void> {
    await db.delete(searchQueries).where(and(eq(searchQueries.sourceId, sourceId), eq(searchQueries.id, id)));
    sqliteDb.flushPendingReactiveQueries();
}

export async function clearSearchQueries(): Promise<void> {
    await db.delete(searchQueries);
    sqliteDb.flushPendingReactiveQueries();
}
