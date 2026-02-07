/**
 * Emby API response types
 * 
 * Note: Emby uses similar API structure to Jellyfin
 */

export interface EmbyPaginationParams {
  offset?: number;
  limit?: number;
}

export interface EmbyQueryResult<T> {
  Items: T[];
  TotalRecordCount: number;
  StartIndex: number;
}

export interface EmbyImageTags {
  Primary?: string;
  Art?: string;
  Banner?: string;
  Logo?: string;
  Thumb?: string;
  Backdrop?: string;
}

export interface EmbyArtist {
  Id: string;
  Name: string;
  ServerId: string;
  Type: 'MusicArtist';
  ImageTags?: EmbyImageTags;
}

export interface EmbyAlbum {
  Id: string;
  Name: string;
  AlbumArtist?: string;
  AlbumArtists?: Array<{ Name: string; Id: string }>;
  ProductionYear?: number;
  ImageTags?: EmbyImageTags;
  ServerId: string;
  Type: 'MusicAlbum';
}

export interface EmbyTrack {
  Id: string;
  Name: string;
  AlbumId: string;
  AlbumArtist?: string;
  Artists?: string[];
  ArtistItems?: Array<{ Name: string; Id: string }>;
  IndexNumber?: number;
  RunTimeTicks?: number;
  ServerId: string;
  Type: 'Audio';
  Path?: string;
}

export interface EmbyPlaylist {
  Id: string;
  Name: string;
  ServerId: string;
  Type: 'Playlist';
  MediaType: 'Audio';
}

export interface EmbyPlaylistItem {
  Id: string;
  PlaylistItemId: string;
  Name: string;
  Type: 'Audio';
}

export type EmbyAlbumsResponse = EmbyQueryResult<EmbyAlbum>;
export type EmbyArtistsResponse = EmbyQueryResult<EmbyArtist>;
export type EmbyTracksResponse = EmbyQueryResult<EmbyTrack>;
export type EmbyPlaylistsResponse = EmbyQueryResult<EmbyPlaylist>;
export type EmbyPlaylistItemsResponse = EmbyQueryResult<EmbyPlaylistItem>;
