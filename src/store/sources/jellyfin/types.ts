/**
 * Jellyfin API response types
 */

export interface JellyfinPaginationParams {
  offset?: number;
  limit?: number;
}

export interface JellyfinQueryResult<T> {
  Items: T[];
  TotalRecordCount: number;
  StartIndex: number;
}

export interface JellyfinImageTags {
  Primary?: string;
  Art?: string;
  Banner?: string;
  Logo?: string;
  Thumb?: string;
  Backdrop?: string;
}

export interface JellyfinArtist {
  Id: string;
  Name: string;
  ServerId: string;
  Type: 'MusicArtist';
  ImageTags?: JellyfinImageTags;
}

export interface JellyfinAlbum {
  Id: string;
  Name: string;
  AlbumArtist?: string;
  AlbumArtists?: Array<{ Name: string; Id: string }>;
  ProductionYear?: number;
  ImageTags?: JellyfinImageTags;
  ServerId: string;
  Type: 'MusicAlbum';
}

export interface JellyfinTrack {
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

export interface JellyfinPlaylist {
  Id: string;
  Name: string;
  ServerId: string;
  Type: 'Playlist';
  MediaType: 'Audio';
}

export interface JellyfinPlaylistItem {
  Id: string;
  PlaylistItemId: string;
  Name: string;
  Type: 'Audio';
}

export type JellyfinAlbumsResponse = JellyfinQueryResult<JellyfinAlbum>;
export type JellyfinArtistsResponse = JellyfinQueryResult<JellyfinArtist>;
export type JellyfinTracksResponse = JellyfinQueryResult<JellyfinTrack>;
export type JellyfinPlaylistsResponse = JellyfinQueryResult<JellyfinPlaylist>;
export type JellyfinPlaylistItemsResponse = JellyfinQueryResult<JellyfinPlaylistItem>;
