/**
 * Database actions for search queries
 */

import { db, sqliteDb } from '@/store/db';
import { searchQueries } from './search-queries';
import { eq } from 'drizzle-orm';
import type { InsertSearchQuery } from './types';

export async function upsertSearchQuery(query: InsertSearchQuery): Promise<void> {
    const now = Date.now();

    await db.insert(searchQueries).values({
        ...query,
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: searchQueries.id,
        set: {
            ...query,
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteSearchQuery(id: string): Promise<void> {
    await db.delete(searchQueries).where(eq(searchQueries.id, id));
    sqliteDb.flushPendingReactiveQueries();
}

export async function deleteSearchQueriesBySource(sourceId: string): Promise<void> {
    await db.delete(searchQueries).where(eq(searchQueries.sourceId, sourceId));
    sqliteDb.flushPendingReactiveQueries();
}
