/**
 * Source Driver Types
 * 
 * Defines the interface for source drivers (Jellyfin, Emby, etc.)
 * and common types used across all drivers.
 */

/**
 * Source types enum
 */
export enum SourceType {
  JELLYFIN_V1 = 'jellyfin.v1',
  EMBY_V1 = 'emby.v1',
}

/**
 * Source information
 */
export interface Source {
  id: string;
  uri: string;
  userId?: string;
  accessToken?: string;
  deviceId?: string;
  type: SourceType;
}

/**
 * Source info returned during connection
 */
export interface SourceInfo {
  id: string;
  name: string;
  version: string;
  operatingSystem?: string;
}

/**
 * Credentials
 */
export interface Credentials {
  accessToken: string;
  userId: string;
}

/**
 * List parameters for paging
 */
export interface ListParams {
  offset?: number;  // Start index (renamed from startIndex)
  limit?: number;   // Page size (default: 500)
}

/**
 * Artist entity
 */
export interface Artist {
  id: string;
  name: string;
  isFolder: boolean;
  [key: string]: any; // Additional metadata
}

/**
 * Album entity
 */
export interface Album {
  id: string;
  name: string;
  productionYear?: number;
  isFolder: boolean;
  albumArtist?: string;
  dateCreated?: number;
  artistItems?: Artist[];
  [key: string]: any; // Additional metadata
}

/**
 * Track entity
 */
export interface Track {
  id: string;
  name: string;
  albumId?: string;
  album?: string;
  albumArtist?: string;
  productionYear?: number;
  indexNumber?: number;
  parentIndexNumber?: number;
  runTimeTicks?: number;
  artistItems?: Artist[];
  [key: string]: any; // Additional metadata
}

/**
 * Playlist entity
 */
export interface Playlist {
  id: string;
  name: string;
  canDelete: boolean;
  childCount?: number;
  [key: string]: any; // Additional metadata
}

/**
 * Search filter types
 */
export enum SearchFilterType {
  ALBUMS = 'albums',
  ARTISTS = 'artists',
  TRACKS = 'tracks',
  PLAYLISTS = 'playlists',
}

/**
 * Search filter
 */
export interface SearchFilter {
  type: SearchFilterType;
}

/**
 * Search result item
 */
export interface SearchResultItem {
  id: string;
  name: string;
  type: SearchFilterType;
  [key: string]: any;
}

/**
 * Codec metadata
 */
export interface CodecMetadata {
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
}

/**
 * Lyrics
 */
export interface Lyrics {
  lyrics: string;
}

/**
 * Stream options
 */
export interface StreamOptions {
  bitrate?: number;
  maxStreamingBitrate?: number;
  audioCodec?: string;
}

/**
 * Download options
 */
export interface DownloadOptions {
  bitrate?: number;
}

/**
 * Download info
 */
export interface DownloadInfo {
  url: string;
  filename: string;
  mimetype?: string;
}

/**
 * Source Driver Interface
 * 
 * All source drivers (Jellyfin, Emby, etc.) must implement this interface
 */
export interface SourceDriver {
  /**
   * Connect to the source and retrieve server info
   */
  connect(): Promise<SourceInfo>;

  /**
   * Refresh credentials (re-authenticate)
   */
  refreshCredentials(): Promise<Credentials>;

  /**
   * Validate current credentials
   */
  validateCredentials(): Promise<boolean>;

  /**
   * Sign out from the source
   */
  signOut(): Promise<void>;

  /**
   * Get list of artists with paging
   */
  getArtists(params?: ListParams): Promise<Artist[]>;

  /**
   * Get list of albums with paging
   */
  getAlbums(params?: ListParams): Promise<Album[]>;

  /**
   * Get a specific album by ID
   */
  getAlbum(albumId: string): Promise<Album>;

  /**
   * Get tracks for an album with paging
   */
  getTracksByAlbum(albumId: string, params?: ListParams): Promise<Track[]>;

  /**
   * Get list of playlists with paging
   */
  getPlaylists(params?: ListParams): Promise<Playlist[]>;

  /**
   * Get a specific playlist by ID
   */
  getPlaylist(playlistId: string): Promise<Playlist>;

  /**
   * Get tracks for a playlist with paging
   */
  getTracksByPlaylist(playlistId: string, params?: ListParams): Promise<Track[]>;

  /**
   * Search for items
   */
  search(query: string, filters: SearchFilter[], params?: ListParams): Promise<SearchResultItem[]>;

  /**
   * Get recent albums with paging
   */
  getRecentAlbums(params?: ListParams): Promise<Album[]>;

  /**
   * Get similar albums for an album with paging
   */
  getSimilarAlbums(albumId: string, params?: ListParams): Promise<Album[]>;

  /**
   * Get instant mix for an entity with paging
   */
  getInstantMix(entityId: string, params?: ListParams): Promise<Track[]>;

  /**
   * Get codec metadata for a track
   */
  getTrackCodecMetadata(trackId: string): Promise<CodecMetadata | null>;

  /**
   * Get lyrics for a track
   */
  getTrackLyrics(trackId: string): Promise<Lyrics | null>;

  /**
   * Get stream URL for a track
   */
  getStreamUrl(trackId: string, options?: StreamOptions): Promise<string>;

  /**
   * Get download info for a track
   */
  getDownloadInfo(trackId: string, options?: DownloadOptions): Promise<DownloadInfo>;

  /**
   * Report playback start
   */
  reportPlaybackStart(trackId: string, positionTicks: number): Promise<void>;

  /**
   * Report playback progress
   */
  reportPlaybackProgress(trackId: string, positionTicks: number): Promise<void>;

  /**
   * Report playback stop
   */
  reportPlaybackStop(trackId: string, positionTicks: number): Promise<void>;
}
