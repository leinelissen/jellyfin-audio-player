import { db, sqliteDb } from '@/store';
import { and, eq, isNull } from 'drizzle-orm';

import syncCursors from './entity';
import { EntityType, type SyncCursor } from './types';

const COMPLETED_TTL_MS = 60_000;

export async function getIncompleteCursors(): Promise<SyncCursor[]> {
    return db.select().from(syncCursors).where(eq(syncCursors.completed, false)).all();
}

export async function createCursorIfNotExists(
    sourceId: string,
    entityType: EntityType,
    parentEntityId?: string,
    parentEntityType?: string,
    pageSize: number = 500,
) {
    await db.insert(syncCursors).values({
        sourceId,
        entityType,
        parentEntityId,
        parentEntityType,
        startIndex: 0,
        pageSize,
        completed: false,
    }).onConflictDoUpdate({
        target: [syncCursors.sourceId, syncCursors.entityType, syncCursors.parentEntityId],
        set: {
            completed: false,
            startIndex: 0,
            updatedAt: Date.now(),
        },
    });

    await sqliteDb.flushPendingReactiveQueries();

    const cursor = await db.query.syncCursors.findFirst({
        where: {
            sourceId,
            entityType,
            parentEntityId: parentEntityId,
            parentEntityType: parentEntityType,
        }
    });

    return cursor;
}

export async function updateCursorOffset(
    sourceId: string,
    entityType: EntityType,
    newOffset: number,
    parentEntityId?: string,
): Promise<void> {
    await db.update(syncCursors)
        .set({ startIndex: newOffset })
        .where(and(
            eq(syncCursors.sourceId, sourceId),
            eq(syncCursors.entityType, entityType),
            parentEntityId !== undefined ? eq(syncCursors.parentEntityId, parentEntityId) : isNull(syncCursors.parentEntityId),
        ));
}

export async function markCursorComplete(
    sourceId: string,
    entityType: EntityType,
    parentEntityId?: string,
): Promise<void> {
    await db.update(syncCursors)
        .set({ completed: true })
        .where(and(
            eq(syncCursors.sourceId, sourceId),
            eq(syncCursors.entityType, entityType),
            parentEntityId !== undefined ? eq(syncCursors.parentEntityId, parentEntityId) : isNull(syncCursors.parentEntityId),
        ));
}

/**
 * Returns true if the cursor was completed within the last COMPLETED_TTL_MS
 * milliseconds. Use this instead of checking cursor.completed directly — the
 * completed flag is reset to false by createCursorIfNotExists on each new sync
 * cycle, so a stale completed=true from a previous run should not be treated as
 * done.
 */
export function isRecentlyCompleted(cursor: SyncCursor): boolean {
    return cursor.completed && (Date.now() - cursor.updatedAt) < COMPLETED_TTL_MS;
}