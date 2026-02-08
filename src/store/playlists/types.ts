/**
 * Playlist types
 */

import type { InferSelectModel } from 'drizzle-orm';
import { playlists } from './playlists';

export type Playlist = InferSelectModel<typeof playlists>;
export type InsertPlaylist = typeof playlists.$inferInsert;
