/**
 * Emby API Response Types
 * 
 * Types for data coming from the Emby API.
 * These use PascalCase to match the API responses.
 */

/**
 * Base item from Emby API
 */
export interface EmbyBaseItem {
    Id: string;
    Name: string;
    ServerId?: string;
    [key: string]: unknown;
}

/**
 * Artist from Emby API
 */
export interface EmbyArtist extends EmbyBaseItem {
    IsFolder: boolean;
}

/**
 * Album from Emby API
 */
export interface EmbyAlbum extends EmbyBaseItem {
    ProductionYear?: number;
    IsFolder: boolean;
    AlbumArtist?: string;
    DateCreated?: string;
    ArtistItems?: EmbyArtist[];
}

/**
 * Track from Emby API
 */
export interface EmbyTrack extends EmbyBaseItem {
    AlbumId?: string;
    Album?: string;
    AlbumArtist?: string;
    ProductionYear?: number;
    IndexNumber?: number;
    ParentIndexNumber?: number;
    RunTimeTicks?: number;
    ArtistItems?: EmbyArtist[];
}

/**
 * Playlist from Emby API
 */
export interface EmbyPlaylist extends EmbyBaseItem {
    CanDelete: boolean;
    ChildCount?: number;
}

/**
 * Items response wrapper
 */
export interface EmbyItemsResponse<T> {
    Items: T[];
    TotalRecordCount: number;
    StartIndex: number;
}

/**
 * Search result from Emby API
 */
export interface EmbySearchResult extends EmbyBaseItem {
    Type: string;
}
