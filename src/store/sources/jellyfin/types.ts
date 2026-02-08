/**
 * Jellyfin API Types
 * 
 * Types for data coming from the Jellyfin API.
 * These use PascalCase to match the API responses.
 */

import type { Platform } from 'react-native';

/**
 * Device name mapping type
 */
export type DeviceMap = Record<typeof Platform['OS'], string>;

/**
 * Track streaming options OS overrides type
 */
export type TrackOptionsOsOverrides = Record<typeof Platform.OS, Record<string, string>>;

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
