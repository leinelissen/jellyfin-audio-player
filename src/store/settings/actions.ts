import { db, sqliteDb } from '@/store';
import settings from '@/store/settings/entity';
import sources from '@/store/sources/entity';
import { eq } from 'drizzle-orm';
import { AppSettings, ColorScheme } from './types';

/**
 * Get app settings (single row, id=1)
 */
export async function getAppSettings(): Promise<AppSettings | undefined> {
    const result = await db.select().from(settings)
        .where(eq(settings.id, 1))
        .limit(1);
    return result[0];
}

/**
 * Initialize app settings with defaults if not exists
 */
export async function initializeAppSettings(): Promise<AppSettings> {
    const existing = await getAppSettings();
    if (existing) {
        return existing;
    }

    const now = Date.now();
    const defaults: typeof settings.$inferInsert = {
        id: 1,
        bitrate: 140000000,
        isOnboardingComplete: false,
        hasReceivedErrorReportingAlert: false,
        enablePlaybackReporting: true,
        colorScheme: ColorScheme.System,
        createdAt: now,
        updatedAt: now,
    };

    await db.insert(settings).values(defaults);
    sqliteDb.flushPendingReactiveQueries();
    return defaults as AppSettings;
}

/**
 * Update app settings
 */
export async function updateAppSettings(updates: Partial<Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    await db.update(settings)
        .set({ ...updates, updatedAt: Date.now() })
        .where(eq(settings.id, 1));
    sqliteDb.flushPendingReactiveQueries();
}

/**
 * Set Jellyfin/Emby credentials
 */
export async function setCredentials(credentials: {
    uri: string;
    userId: string;
    accessToken: string;
    deviceId: string;
    type: 'jellyfin' | 'emby';
}): Promise<void> {
    const now = Date.now();
    const sourceType = credentials.type === 'jellyfin' ? 'jellyfin.v1' : 'emby.v1';
    
    // Use deviceId as the source id for consistency
    const sourceId = credentials.deviceId;

    await db.insert(sources)
        .values({
            id: sourceId,
            uri: credentials.uri,
            userId: credentials.userId,
            accessToken: credentials.accessToken,
            deviceId: credentials.deviceId,
            type: sourceType,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: sources.id,
            set: {
                uri: credentials.uri,
                userId: credentials.userId,
                accessToken: credentials.accessToken,
                deviceId: credentials.deviceId,
                type: sourceType,
                updatedAt: now,
            },
        });
    
    sqliteDb.flushPendingReactiveQueries();
}
