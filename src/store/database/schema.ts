import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/op-sqlite';

// Artists table
export const artists = sqliteTable(
  'artists',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    jellyfin_id: text('jellyfin_id').notNull().unique(),
    created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    nameIdx: index('artists_name_idx').on(table.name),
  })
);

// Albums table (denormalized with artist name for quick access)
export const albums = sqliteTable(
  'albums',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    artist_id: integer('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
    artist: text('artist').notNull(), // Denormalized artist name
    year: integer('year'),
    image_url: text('image_url'),
    jellyfin_id: text('jellyfin_id').notNull().unique(),
    created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    artistIdIdx: index('albums_artist_id_idx').on(table.artist_id),
    nameIdx: index('albums_name_idx').on(table.name),
    yearIdx: index('albums_year_idx').on(table.year),
  })
);

// Tracks table
export const tracks = sqliteTable(
  'tracks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    album_id: integer('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    artist_id: integer('artist_id')
      .notNull()
      .references(() => artists.id, { onDelete: 'cascade' }),
    duration: integer('duration').notNull(), // Duration in milliseconds
    track_number: integer('track_number'),
    jellyfin_id: text('jellyfin_id').notNull().unique(),
    file_path: text('file_path'), // Local file path for offline access
    created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    albumIdIdx: index('tracks_album_id_idx').on(table.album_id),
    artistIdIdx: index('tracks_artist_id_idx').on(table.artist_id),
    nameIdx: index('tracks_name_idx').on(table.name),
    trackNumberIdx: index('tracks_track_number_idx').on(table.track_number),
  })
);

// Playlists table
export const playlists = sqliteTable(
  'playlists',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    jellyfin_id: text('jellyfin_id').notNull().unique(),
    created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    nameIdx: index('playlists_name_idx').on(table.name),
  })
);

// Playlist tracks junction table
export const playlist_tracks = sqliteTable(
  'playlist_tracks',
  {
    playlist_id: integer('playlist_id')
      .notNull()
      .references(() => playlists.id, { onDelete: 'cascade' }),
    track_id: integer('track_id')
      .notNull()
      .references(() => tracks.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(), // Order of track in playlist
    created_at: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    // Composite primary key ensures each position in a playlist is unique
    // Allows the same track multiple times at different positions
    pk: primaryKey({ columns: [table.playlist_id, table.position] }),
    playlistIdIdx: index('playlist_tracks_playlist_id_idx').on(
      table.playlist_id
    ),
    trackIdIdx: index('playlist_tracks_track_id_idx').on(table.track_id),
  })
);

// Type exports for use in application code
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;

export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;

export type PlaylistTrack = typeof playlist_tracks.$inferSelect;
export type NewPlaylistTrack = typeof playlist_tracks.$inferInsert;
