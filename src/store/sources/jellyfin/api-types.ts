/**
 * Jellyfin API Response Types
 * 
 * Types for data coming from the Jellyfin API.
 * These use PascalCase to match the API responses.
 */

/**
 * Base item from Jellyfin API
 */
export interface JellyfinBaseItem {
    Id: string;
    Name: string;
    ServerId?: string;
    [key: string]: unknown;
}

/**
 * Artist from Jellyfin API
 */
export interface JellyfinArtist extends JellyfinBaseItem {
    IsFolder: boolean;
}

/**
 * Album from Jellyfin API
 */
export interface JellyfinAlbum extends JellyfinBaseItem {
    ProductionYear?: number;
    IsFolder: boolean;
    AlbumArtist?: string;
    DateCreated?: string;
    ArtistItems?: JellyfinArtist[];
}

/**
 * Track from Jellyfin API
 */
export interface JellyfinTrack extends JellyfinBaseItem {
    AlbumId?: string;
    Album?: string;
    AlbumArtist?: string;
    ProductionYear?: number;
    IndexNumber?: number;
    ParentIndexNumber?: number;
    RunTimeTicks?: number;
    ArtistItems?: JellyfinArtist[];
}

/**
 * Playlist from Jellyfin API
 */
export interface JellyfinPlaylist extends JellyfinBaseItem {
    CanDelete: boolean;
    ChildCount?: number;
}

/**
 * Items response wrapper
 */
export interface JellyfinItemsResponse<T> {
    Items: T[];
    TotalRecordCount: number;
    StartIndex: number;
}

/**
 * Search result from Jellyfin API
 */
export interface JellyfinSearchResult extends JellyfinBaseItem {
    Type: string;
}
