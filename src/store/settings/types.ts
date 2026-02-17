import type { InferSelectModel } from 'drizzle-orm';
import settings from './entity';

export enum ColorScheme {
    System = 'system',
    Light = 'light',
    Dark = 'dark',
}

export type AppSettings = InferSelectModel<typeof settings>;
export type InsertAppSettings = typeof settings.$inferInsert;
    