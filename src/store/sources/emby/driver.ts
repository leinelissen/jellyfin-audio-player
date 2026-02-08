/**
 * Emby Source Driver
 * 
 * Implements the SourceDriver interface for Emby servers.
 * Provides paging support for all list endpoints.
 */

import { Platform } from 'react-native';
import { version } from '../../../../package.json';
import {
  SourceDriver,
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

/** Map the output of `Platform.OS`, so that Emby can understand it. */
const deviceMap: Record<typeof Platform['OS'], string> = {
  ios: 'iOS',
  android: 'Android',
  macos: 'macOS',
  web: 'Web',
  windows: 'Windows',
};

const DEFAULT_LIMIT = 500;

export class EmbyDriver extends SourceDriver {
  /**
   * Generate authentication headers for requests
   */
  private generateHeaders(): Record<string, string> {
    return {
      'X-Emby-Authorization': `MediaBrowser Client="Fintunes", Device="${deviceMap[Platform.OS]}", DeviceId="${this.source.deviceId}", Version="${version}", Token="${this.source.accessToken}"`,
    };
  }

  /**
   * Execute an API request
   */
  private async fetch<T>(path: string, config?: RequestInit): Promise<T> {
    const url = `${this.source.uri}${path.startsWith('/') ? '' : '/'}${path}`;
    
    const response = await fetch(url, {
      ...config,
      headers: {
        ...config?.headers,
        ...this.generateHeaders(),
      },
    });

    if (__DEV__) {
      console.log(`%c[HTTP] → [${response.status}] ${url}`, 'font-weight:bold;');
    }

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error('AuthenticationFailed');
      } else if (response.status === 404) {
        throw new Error('ResourceNotFound');
      }
      throw new Error('FailedRequest');
    }

    return response.json();
  }

  /**
   * Connect to the Emby server
   */
  async connect(): Promise<SourceInfo> {
    const data = await this.fetch<{
      Id: string;
      ServerName: string;
      Version: string;
      OperatingSystem: string;
    }>('/System/Info');
    
    return {
      id: data.Id,
      name: data.ServerName,
      version: data.Version,
      operatingSystem: data.OperatingSystem,
    };
  }

  /**
   * Get artists with paging
   */
  async getArtists(params?: ListParams): Promise<Artist[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      Recursive: 'true',
      Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated,Overview',
      ImageTypeLimit: '1',
      EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      IsFolder: boolean;
      [key: string]: unknown;
    }> }>(`/Artists/AlbumArtists?${queryParams}`);
    
    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      isFolder: item.IsFolder || false,
      ...item,
    }));
  }

  /**
   * Get albums with paging
   */
  async getAlbums(params?: ListParams): Promise<Album[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      SortBy: 'AlbumArtist,SortName',
      SortOrder: 'Ascending',
      IncludeItemTypes: 'MusicAlbum',
      Recursive: 'true',
      Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated',
      ImageTypeLimit: '1',
      EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      ProductionYear?: number;
      IsFolder: boolean;
      AlbumArtist?: string;
      DateCreated?: string;
      ArtistItems?: Array<{
        Id: string;
        Name: string;
        IsFolder: boolean;
      }>;
      [key: string]: unknown;
    }> }>(
      `/Users/${this.source.userId}/Items?${queryParams}`
    );

    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      productionYear: item.ProductionYear,
      isFolder: item.IsFolder || false,
      albumArtist: item.AlbumArtist,
      dateCreated: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
      artistItems: item.ArtistItems || [],
      ...item,
    }));
  }

  /**
   * Get a specific album
   */
  async getAlbum(albumId: string): Promise<Album> {
    const item = await this.fetch<{
      Id: string;
      Name: string;
      ProductionYear?: number;
      IsFolder: boolean;
      AlbumArtist?: string;
      DateCreated?: string;
      ArtistItems?: Array<{
        Id: string;
        Name: string;
        IsFolder: boolean;
      }>;
      [key: string]: unknown;
    }>(`/Users/${this.source.userId}/Items/${albumId}`);
    
    return {
      id: item.Id,
      name: item.Name,
      productionYear: item.ProductionYear,
      isFolder: item.IsFolder || false,
      albumArtist: item.AlbumArtist,
      dateCreated: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
      artistItems: item.ArtistItems || [],
      ...item,
    };
  }

  /**
   * Get tracks for an album with paging
   */
  async getTracksByAlbum(albumId: string, params?: ListParams): Promise<Track[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      ParentId: albumId,
      SortBy: 'ParentIndexNumber,IndexNumber,SortName',
      Fields: 'MediaStreams',
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      AlbumId?: string;
      Album?: string;
      AlbumArtist?: string;
      ProductionYear?: number;
      IndexNumber?: number;
      ParentIndexNumber?: number;
      RunTimeTicks?: number;
      ArtistItems?: Array<{
        Id: string;
        Name: string;
        IsFolder: boolean;
      }>;
      [key: string]: unknown;
    }> }>(
      `/Users/${this.source.userId}/Items?${queryParams}`
    );

    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      albumId: item.AlbumId,
      album: item.Album,
      albumArtist: item.AlbumArtist,
      productionYear: item.ProductionYear,
      indexNumber: item.IndexNumber,
      parentIndexNumber: item.ParentIndexNumber,
      runTimeTicks: item.RunTimeTicks,
      artistItems: item.ArtistItems || [],
      ...item,
    }));
  }

  /**
   * Get playlists with paging
   */
  async getPlaylists(params?: ListParams): Promise<Playlist[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      IncludeItemTypes: 'Playlist',
      Recursive: 'true',
      Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated,ChildCount',
      ImageTypeLimit: '1',
      EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      CanDelete: boolean;
      ChildCount?: number;
      [key: string]: unknown;
    }> }>(
      `/Users/${this.source.userId}/Items?${queryParams}`
    );

    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      canDelete: item.CanDelete || false,
      childCount: item.ChildCount,
      ...item,
    }));
  }

  /**
   * Get a specific playlist
   */
  async getPlaylist(playlistId: string): Promise<Playlist> {
    const item = await this.fetch<{
      Id: string;
      Name: string;
      CanDelete: boolean;
      ChildCount?: number;
      [key: string]: unknown;
    }>(`/Users/${this.source.userId}/Items/${playlistId}`);
    
    return {
      id: item.Id,
      name: item.Name,
      canDelete: item.CanDelete || false,
      childCount: item.ChildCount,
      ...item,
    };
  }

  /**
   * Get tracks for a playlist with paging
   */
  async getTracksByPlaylist(playlistId: string, params?: ListParams): Promise<Track[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      SortBy: 'IndexNumber,SortName',
      UserId: this.source.userId || '',
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      AlbumId?: string;
      Album?: string;
      AlbumArtist?: string;
      ProductionYear?: number;
      IndexNumber?: number;
      ParentIndexNumber?: number;
      RunTimeTicks?: number;
      ArtistItems?: Array<{
        Id: string;
        Name: string;
        IsFolder: boolean;
      }>;
      [key: string]: unknown;
    }> }>(
      `/Playlists/${playlistId}/Items?${queryParams}`
    );

    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      albumId: item.AlbumId,
      album: item.Album,
      albumArtist: item.AlbumArtist,
      productionYear: item.ProductionYear,
      indexNumber: item.IndexNumber,
      parentIndexNumber: item.ParentIndexNumber,
      runTimeTicks: item.RunTimeTicks,
      artistItems: item.ArtistItems || [],
      ...item,
    }));
  }

  /**
   * Search for items
   */
  async search(
    query: string,
    _filters: SearchFilter[],
    params?: ListParams
  ): Promise<SearchResultItem[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      IncludeItemTypes: 'Audio,MusicAlbum,Playlist',
      SortBy: 'SearchScore,Album,SortName',
      SortOrder: 'Ascending',
      Recursive: 'true',
      Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated,Overview',
      ImageTypeLimit: '1',
      EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
      SearchTerm: query,
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      Type: string;
      [key: string]: unknown;
    }> }>(
      `/Users/${this.source.userId}/Items?${queryParams}`
    );

    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      type: item.Type === 'MusicAlbum' ? 'albums' : item.Type === 'Audio' ? 'tracks' : 'playlists',
      ...item,
    })) as SearchResultItem[];
  }

  /**
   * Get recent albums
   */
  async getRecentAlbums(params?: ListParams): Promise<Album[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      IncludeItemTypes: 'MusicAlbum',
      Fields: 'DateCreated',
      SortOrder: 'Descending',
      SortBy: 'DateCreated',
      Recursive: 'true',
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      ProductionYear?: number;
      IsFolder: boolean;
      AlbumArtist?: string;
      DateCreated?: string;
      ArtistItems?: Array<{
        Id: string;
        Name: string;
        IsFolder: boolean;
      }>;
      [key: string]: unknown;
    }> }>(
      `/Users/${this.source.userId}/Items?${queryParams}`
    );

    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      productionYear: item.ProductionYear,
      isFolder: item.IsFolder || false,
      albumArtist: item.AlbumArtist,
      dateCreated: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
      artistItems: item.ArtistItems || [],
      ...item,
    }));
  }

  /**
   * Get similar albums
   */
  async getSimilarAlbums(albumId: string, params?: ListParams): Promise<Album[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      userId: this.source.userId || '',
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      ProductionYear?: number;
      IsFolder: boolean;
      AlbumArtist?: string;
      DateCreated?: string;
      ArtistItems?: Array<{
        Id: string;
        Name: string;
        IsFolder: boolean;
      }>;
      [key: string]: unknown;
    }> }>(
      `/Items/${albumId}/Similar?${queryParams}`
    );

    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      productionYear: item.ProductionYear,
      isFolder: item.IsFolder || false,
      albumArtist: item.AlbumArtist,
      dateCreated: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
      artistItems: item.ArtistItems || [],
      ...item,
    }));
  }

  /**
   * Get instant mix
   */
  async getInstantMix(entityId: string, params?: ListParams): Promise<Track[]> {
    const offset = params?.offset || 0;
    const limit = params?.limit || DEFAULT_LIMIT;

    const queryParams = new URLSearchParams({
      UserId: this.source.userId || '',
      StartIndex: offset.toString(),
      Limit: limit.toString(),
    });

    const response = await this.fetch<{ Items: Array<{
      Id: string;
      Name: string;
      AlbumId?: string;
      Album?: string;
      AlbumArtist?: string;
      ProductionYear?: number;
      IndexNumber?: number;
      ParentIndexNumber?: number;
      RunTimeTicks?: number;
      ArtistItems?: Array<{
        Id: string;
        Name: string;
        IsFolder: boolean;
      }>;
      [key: string]: unknown;
    }> }>(
      `/Items/${entityId}/InstantMix?${queryParams}`
    );

    return response.Items.map(item => ({
      id: item.Id,
      name: item.Name,
      albumId: item.AlbumId,
      album: item.Album,
      albumArtist: item.AlbumArtist,
      productionYear: item.ProductionYear,
      indexNumber: item.IndexNumber,
      parentIndexNumber: item.ParentIndexNumber,
      runTimeTicks: item.RunTimeTicks,
      artistItems: item.ArtistItems || [],
      ...item,
    }));
  }

  /**
   * Get track codec metadata
   */
  async getTrackCodecMetadata(trackId: string): Promise<CodecMetadata | null> {
    const url = await this.getStreamUrl(trackId);
    const response = await fetch(url, { method: 'HEAD' });

    return {
      codec: response.headers.get('Content-Type') || undefined,
      bitrate: response.headers.has('Content-Length') ? undefined : undefined,
    };
  }

  /**
   * Get track lyrics
   */
  async getTrackLyrics(trackId: string): Promise<Lyrics | null> {
    try {
      return await this.fetch<Lyrics>(`/Audio/${trackId}/Lyrics`);
    } catch {
      return null;
    }
  }

  /**
   * Get stream URL for a track
   */
  async getStreamUrl(trackId: string, options?: StreamOptions): Promise<string> {
    const trackOptionsOsOverrides: Record<typeof Platform.OS, Record<string, string>> = {
      ios: {
        Container: 'mp3,aac,m4a|aac,m4b|aac,flac,alac,m4a|alac,m4b|alac,wav,m4a,aiff,aif',
      },
      android: {
        Container: 'mp3,aac,flac,wav,ogg,ogg|vorbis,ogg|opus,mka|mp3,mka|opus,mka|mp3',
      },
      macos: {},
      web: {},
      windows: {},
    };

    const queryParams = new URLSearchParams({
      TranscodingProtocol: 'http',
      TranscodingContainer: 'aac',
      AudioCodec: options?.audioCodec || 'aac',
      Container: 'mp3,aac',
      audioBitRate: (options?.bitrate || 320000).toString(),
      UserId: this.source.userId || '',
      api_key: this.source.accessToken || '',
      DeviceId: this.source.deviceId || '',
      ...trackOptionsOsOverrides[Platform.OS],
    });

    return `${this.source.uri}/Audio/${trackId}/universal?${queryParams}`;
  }

  /**
   * Get download info for a track
   */
  async getDownloadInfo(trackId: string, options?: DownloadOptions): Promise<DownloadInfo> {
    const url = await this.getStreamUrl(trackId, { bitrate: options?.bitrate });
    
    return {
      url,
      filename: `${trackId}.mp3`,
      mimetype: 'audio/mpeg',
    };
  }

  /**
   * Report playback start
   */
  async reportPlaybackStart(trackId: string, positionTicks: number): Promise<void> {
    const payload = {
      ItemId: trackId,
      PositionTicks: positionTicks,
      MediaSourceId: trackId,
      CanSeek: true,
      PlayMethod: 'transcode',
    };

    await this.fetch('/Sessions/Playing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.error('Failed to report playback start:', err));
  }

  /**
   * Report playback progress
   */
  async reportPlaybackProgress(trackId: string, positionTicks: number): Promise<void> {
    const payload = {
      ItemId: trackId,
      PositionTicks: positionTicks,
      MediaSourceId: trackId,
      IsPaused: false,
      CanSeek: true,
      PlayMethod: 'transcode',
    };

    await this.fetch('/Sessions/Playing/Progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.error('Failed to report playback progress:', err));
  }

  /**
   * Report playback stop
   */
  async reportPlaybackStop(trackId: string, positionTicks: number): Promise<void> {
    const payload = {
      ItemId: trackId,
      PositionTicks: positionTicks,
      MediaSourceId: trackId,
    };

    await this.fetch('/Sessions/Playing/Stopped', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.error('Failed to report playback stop:', err));
  }
}
