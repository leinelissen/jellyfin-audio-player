/**
 * Emby Driver Types
 * 
 * Re-exports common source driver types and defines Emby-specific types
 */

// Re-export all common types
export type {
  Source,
  SourceInfo,
  Credentials,
  ListParams,
  Artist,
  Album,
  Track,
  Playlist,
  SearchFilter,
  SearchResultItem,
  CodecMetadata,
  Lyrics,
  StreamOptions,
  DownloadOptions,
  DownloadInfo,
} from '../types';

export {
  SourceType,
  SearchFilterType,
  SourceDriver,
} from '../types';

// Emby-specific types can be added here as needed
