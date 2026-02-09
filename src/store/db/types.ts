import type { InferSelectModel } from 'drizzle-orm';
import artists from '../artists/entity';
import albums from '../albums/entity';
import tracks from '../tracks/entity';
import playlists from '../playlists/entity';

export type Artist = InferSelectModel<typeof artists>;
export type Album = InferSelectModel<typeof albums>;
export type Track = InferSelectModel<typeof tracks>;
export type Playlist = InferSelectModel<typeof playlists>;
