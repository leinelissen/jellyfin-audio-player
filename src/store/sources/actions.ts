import { db, sqliteDb } from "..";
import getDriverBySource from "./drivers";
import { SourceType, SourceCredentials } from "./types";
import sources from "./entity";
import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { driverRegistry } from "./drivers/registry";

type Source = InferSelectModel<typeof sources>;

/**
 * Retrieve all sources from the database
 */
export async function getSources() {
    return db.query.sources.findMany();
}

/**
 * Instantiate all sources with their respective drivers
 */
export async function getAllSourceDrivers() {
    // Retrieve all sources first
    const allSources = await getSources();

    // Then, loop through all sources
    return allSources.map((source) => {
        // Retrieve the appropriate driver class for this source type
        const Driver = getDriverBySource(source.type as SourceType);

        // Instantiate and return the driver for this source
        return new Driver(source);
    });
}

/**
 * Find an existing source row by server URI and userId.
 *
 * Useful for checking whether a server has already been added before
 * inserting a new row, without relying on the primary key.
 */
export async function getSourceByServer(uri: string, userId: string): Promise<Source | undefined> {
    return db.select().from(sources).where(and(
        eq(sources.uri, uri),
        eq(sources.userId, userId),
    )).get();
}

/**
 * Upsert Jellyfin/Emby credentials as a source row.
 *
 * If a row already exists for the same (uri, userId) pair it is updated in
 * place; otherwise a new row is inserted with a fresh random UUID as the
 * primary key.
 */
export async function setCredentials(credentials: SourceCredentials): Promise<void> {
    // Check if a source already exists for this server URI and userId
    const existing = await getSourceByServer(credentials.uri, credentials.userId);

    // If so, update the existing row with the new credentials; otherwise insert
    if (existing) {
        await db.update(sources)
            .set(credentials)
            .where(eq(sources.id, existing.id));
    } else {
        await db.insert(sources).values(credentials);
    }

    // Flush pending reactive queries so any UI subscribed to `sources` updates
    await sqliteDb.flushPendingReactiveQueries();

    // Refresh the driver registry so any changes are reflected in the in-memory cache and active drivers
    await driverRegistry.refresh();
}
