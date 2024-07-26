import {Lyrics} from '@/utility/JellyfinApi/lyrics.ts';

export interface UserData {
    PlaybackPositionTicks: number;
    PlayCount: number;
    IsFavorite: boolean;
    Played: boolean;
    Key: string;
}

export interface MediaStream {
    Codec: string
    TimeBase: string
    VideoRange: string
    VideoRangeType: string
    AudioSpatialFormat: string
    DisplayTitle: string
    IsInterlaced: boolean
    ChannelLayout: string
    BitRate: number
    Channels: number
    SampleRate: number
    IsDefault: boolean
    IsForced: boolean
    IsHearingImpaired: boolean
    Type: string
    Index: number
    IsExternal: boolean
    IsTextSubtitleStream: boolean
    SupportsExternalStream: boolean
    Level: number
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
    Overview?: string;
    Similar?: string[];
    /** Emby potentially carries different ids for primary images */
    PrimaryImageItemId?: string;
}

export interface AlbumTrack {
    Name: string;
    ServerId: string;
    Id: string;
    RunTimeTicks: number;
    ProductionYear: number;
    IndexNumber: number;
    ParentIndexNumber: number;
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
    HasLyrics: boolean;
    Lyrics: Lyrics | null;
    MediaStreams: MediaStream[];
}

export interface State {
    albums: {
        ids: string[];
        entities: Record<string, Album>;
        isLoading: boolean;
    }
}

export interface Playlist {
    Name: string;
    ServerId: string;
    Id: string;
    CanDelete: boolean;
    SortName: string;
    ChannelId?: any;
    RunTimeTicks: number;
    IsFolder: boolean;
    Type: string;
    UserData: UserData;
    PrimaryImageAspectRatio: number;
    ImageTags: ImageTags;
    BackdropImageTags: any[];
    LocationType: string;
    MediaType: string;
    Tracks?: string[];
    lastRefreshed?: number;
}
