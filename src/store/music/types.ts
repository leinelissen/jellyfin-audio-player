import { Dictionary } from '@reduxjs/toolkit';

export interface UserData {
    PlaybackPositionTicks: number;
    PlayCount: number;
    IsFavorite: boolean;
    Played: boolean;
    Key: string;
}

export interface ArtistItem {
    Name: string;
    Id: string;
}

export interface AlbumArtist {
    Name: string;
    Id: string;
}

export interface ImageTags {
    Primary: string;
}

export interface Album {
    Name: string;
    ServerId: string;
    Id: string;
    SortName: string;
    RunTimeTicks: number;
    ProductionYear: number;
    IsFolder: boolean;
    Type: 'MusicAlbum';
    UserData: UserData;
    PrimaryImageAspectRatio: number;
    Artists: string[];
    ArtistItems: ArtistItem[];
    AlbumArtist?: string;
    AlbumArtists: AlbumArtist[];
    ImageTags: ImageTags;
    BackdropImageTags: any[];
    LocationType: string;
    Tracks?: string[];
    lastRefreshed?: number;
    DateCreated: string;
}

export interface AlbumTrack {
    Name: string;
    ServerId: string;
    Id: string;
    RunTimeTicks: number;
    ProductionYear: number;
    IndexNumber: number;
    IsFolder: boolean;
    Type: 'Audio';
    UserData: UserData;
    Artists: string[];
    ArtistItems: ArtistItem[];
    Album: string;
    AlbumId: string;
    AlbumPrimaryImageTag: string;
    AlbumArtist: string;
    AlbumArtists: AlbumArtist[];
    ImageTags: ImageTags;
    BackdropImageTags: any[];
    LocationType: string;
    MediaType: string;
}

export interface State {
    albums: {
        ids: string[];
        entities: Dictionary<Album>;
        isLoading: boolean;
    }
}