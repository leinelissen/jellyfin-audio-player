// Database enums for Jellyfin Audio Player
// These enums are used in application code for type safety and validation.
// They are not directly used in the database schema but define the valid values
// that can be stored as text fields in various tables or used in application logic.

export enum MediaType {
  Audio = 'Audio',
  Video = 'Video',
  Photo = 'Photo',
}

export enum ItemType {
  Album = 'Album',
  Artist = 'Artist',
  Track = 'Track',
  Playlist = 'Playlist',
}

export enum SyncStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Failed = 'Failed',
}
