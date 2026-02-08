import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * App settings - global application settings (single row, id=1)
 */
export const appSettings = sqliteTable('app_settings', {
    id: integer('id').primaryKey().$default(() => 1),
    bitrate: integer('bitrate').notNull(),
    isOnboardingComplete: integer('is_onboarding_complete', { mode: 'boolean' }).notNull(),
    hasReceivedErrorReportingAlert: integer('has_received_error_reporting_alert', { mode: 'boolean' }).notNull(),
    enablePlaybackReporting: integer('enable_playback_reporting', { mode: 'boolean' }).notNull(),
    colorScheme: text('color_scheme').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});
