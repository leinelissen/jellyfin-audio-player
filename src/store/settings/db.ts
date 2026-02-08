import { db, sqliteDb } from '@/store/db';
import { appSettings } from '@/store/db/schema/app-settings';
import { sources } from '@/store/db/schema/sources';
import { eq } from 'drizzle-orm';
import { ColorScheme } from './types';

export interface AppSettings {
    id: number;
    bitrate: number;
    isOnboardingComplete: boolean;
    hasReceivedErrorReportingAlert: boolean;
    enablePlaybackReporting: boolean;
    colorScheme: ColorScheme;
    createdAt: number;
    updatedAt: number;
}

export interface SourceCredentials {
    id: string;
    uri: string;
    userId: string | null;
    accessToken: string | null;
    deviceId: string | null;
    type: string;
}

/**
 * Get app settings (single row, id=1)
 */
export async function getAppSettings(): Promise<AppSettings | undefined> {
    const result = await db.select().from(appSettings).where(eq(appSettings.id, 1)).limit(1);
    return result[0] as AppSettings | undefined;
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
    const defaults: typeof appSettings.$inferInsert = {
        id: 1,
        bitrate: 140000000,
        isOnboardingComplete: false,
        hasReceivedErrorReportingAlert: false,
        enablePlaybackReporting: true,
        colorScheme: ColorScheme.System,
        createdAt: now,
        updatedAt: now,
    };

    await db.insert(appSettings).values(defaults);
    sqliteDb.flushPendingReactiveQueries();
    return defaults as AppSettings;
}

/**
 * Update app settings
 */
export async function updateAppSettings(updates: Partial<Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    await db.update(appSettings)
        .set({ ...updates, updatedAt: Date.now() })
        .where(eq(appSettings.id, 1));
    sqliteDb.flushPendingReactiveQueries();
}

/**
 * Set bitrate
 */
export async function setBitrate(bitrate: number): Promise<void> {
    await updateAppSettings({ bitrate });
}

/**
 * Set onboarding status
 */
export async function setOnboardingStatus(isOnboardingComplete: boolean): Promise<void> {
    await updateAppSettings({ isOnboardingComplete });
}

/**
 * Set error reporting alert received
 */
export async function setReceivedErrorReportingAlert(): Promise<void> {
    await updateAppSettings({ hasReceivedErrorReportingAlert: true });
}

/**
 * Set enable playback reporting
 */
export async function setEnablePlaybackReporting(enablePlaybackReporting: boolean): Promise<void> {
    await updateAppSettings({ enablePlaybackReporting });
}

/**
 * Set color scheme
 */
export async function setColorScheme(colorScheme: ColorScheme): Promise<void> {
    await updateAppSettings({ colorScheme });
}

/**
 * Get active source (credentials)
 */
export async function getActiveSource(): Promise<SourceCredentials | undefined> {
    const result = await db.select().from(sources).limit(1);
    return result[0] as SourceCredentials | undefined;
}

/**
 * Set Jellyfin/Emby credentials
 */
export async function setCredentials(credentials: {
    uri: string;
    user_id: string;
    access_token: string;
    device_id: string;
    type: 'jellyfin' | 'emby';
}): Promise<void> {
    const now = Date.now();
    const sourceType = credentials.type === 'jellyfin' ? 'jellyfin.v1' : 'emby.v1';
    
    // Use device_id as the source id for consistency
    const sourceId = credentials.device_id;

    await db.insert(sources)
        .values({
            id: sourceId,
            uri: credentials.uri,
            userId: credentials.user_id,
            accessToken: credentials.access_token,
            deviceId: credentials.device_id,
            type: sourceType,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: sources.id,
            set: {
                uri: credentials.uri,
                userId: credentials.user_id,
                accessToken: credentials.access_token,
                deviceId: credentials.device_id,
                type: sourceType,
                updatedAt: now,
            },
        });
    
    sqliteDb.flushPendingReactiveQueries();
}
