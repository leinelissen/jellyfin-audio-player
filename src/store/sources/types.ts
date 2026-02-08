/**
 * Shared Source Driver Types
 * 
 * Defines common types and the base abstract class for source drivers
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
  offset?: number;  // Start index
  limit?: number;   // Page size (default: 500)
}

/**
 * Artist entity
 */
export interface Artist {
  id: string;
  name: string;
  isFolder: boolean;
  [key: string]: unknown; // Additional metadata
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
  [key: string]: unknown; // Additional metadata
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
  [key: string]: unknown; // Additional metadata
}

/**
 * Playlist entity
 */
export interface Playlist {
  id: string;
  name: string;
  canDelete: boolean;
  childCount?: number;
  [key: string]: unknown; // Additional metadata
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
  [key: string]: unknown;
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
 * Source Driver Abstract Class
 * 
 * All source drivers (Jellyfin, Emby, etc.) must extend this class
 * Optional methods have default implementations
 */
export abstract class SourceDriver {
    protected source: Source;

    constructor(source: Source) {
        this.source = source;
    }

  /**
   * Connect to the source and retrieve server info
   */
  abstract connect(): Promise<SourceInfo>;

  /**
   * Refresh credentials (re-authenticate)
   * Default implementation throws error
   */
  refreshCredentials(): Promise<Credentials> {
      throw new Error('refreshCredentials not implemented');
  }

  /**
   * Validate current credentials
   * Default implementation tries to connect
   */
  async validateCredentials(): Promise<boolean> {
      try {
          await this.connect();
          return true;
      } catch {
          return false;
      }
  }

  /**
   * Sign out from the source
   * Default implementation does nothing
   */
  async signOut(): Promise<void> {
      // Default: no-op
  }

  /**
   * Get list of artists with paging
   */
  abstract getArtists(params?: ListParams): Promise<Artist[]>;

  /**
   * Get list of albums with paging
   */
  abstract getAlbums(params?: ListParams): Promise<Album[]>;

  /**
   * Get a specific album by ID
   */
  abstract getAlbum(albumId: string): Promise<Album>;

  /**
   * Get tracks for an album with paging
   */
  abstract getTracksByAlbum(albumId: string, params?: ListParams): Promise<Track[]>;

  /**
   * Get list of playlists with paging
   */
  abstract getPlaylists(params?: ListParams): Promise<Playlist[]>;

  /**
   * Get a specific playlist by ID
   */
  abstract getPlaylist(playlistId: string): Promise<Playlist>;

  /**
   * Get tracks for a playlist with paging
   */
  abstract getTracksByPlaylist(playlistId: string, params?: ListParams): Promise<Track[]>;

  /**
   * Search for items
   */
  abstract search(query: string, filters: SearchFilter[], params?: ListParams): Promise<SearchResultItem[]>;

  /**
   * Get recent albums with paging
   */
  abstract getRecentAlbums(params?: ListParams): Promise<Album[]>;

  /**
   * Get similar albums for an album with paging
   */
  abstract getSimilarAlbums(albumId: string, params?: ListParams): Promise<Album[]>;

  /**
   * Get instant mix for an entity with paging
   */
  abstract getInstantMix(entityId: string, params?: ListParams): Promise<Track[]>;

  /**
   * Get codec metadata for a track
   */
  abstract getTrackCodecMetadata(trackId: string): Promise<CodecMetadata | null>;

  /**
   * Get lyrics for a track
   */
  abstract getTrackLyrics(trackId: string): Promise<Lyrics | null>;

  /**
   * Get stream URL for a track
   */
  abstract getStreamUrl(trackId: string, options?: StreamOptions): Promise<string>;

  /**
   * Get download info for a track
   */
  abstract getDownloadInfo(trackId: string, options?: DownloadOptions): Promise<DownloadInfo>;

  /**
   * Report playback start
   */
  abstract reportPlaybackStart(trackId: string, positionTicks: number): Promise<void>;

  /**
   * Report playback progress
   */
  abstract reportPlaybackProgress(trackId: string, positionTicks: number): Promise<void>;

  /**
   * Report playback stop
   */
  abstract reportPlaybackStop(trackId: string, positionTicks: number): Promise<void>;
}
