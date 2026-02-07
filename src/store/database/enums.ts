// Database enums for Jellyfin Audio Player

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
