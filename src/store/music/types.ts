export interface ArtistItem {
    Id: string;
    Name?: string;
    PrimaryImageItemId?: string;
    ImageTags?: {
        Primary?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface MediaStream {
    Type?: string;
    Codec?: string;
    BitRate?: number;
    SampleRate?: number;
    [key: string]: unknown;
}

export interface TrackLyricsLine {
    Start: number;
    Text?: string;
    [key: string]: unknown;
}

export interface TrackLyrics {
    Lyrics: TrackLyricsLine[];
    [key: string]: unknown;
}

export interface CodecInfo {
    isDirectPlay?: boolean;
    contentType?: string;
    [key: string]: unknown;
}

export interface Album {
    Id: string;
    Name: string;
    AlbumArtist?: string | null;
    Artists?: string[];
    ArtistItems?: ArtistItem[];
    Overview?: string;
    PrimaryImageItemId?: string;
    DateCreated?: string;
    ProductionYear?: number | null;
    IsFolder?: boolean;
    lastRefreshed?: number;
    Similar?: string[];
    [key: string]: unknown;
}

export interface MusicArtist {
    Id: string;
    Name: string;
    IsFolder?: boolean;
    Overview?: string;
    PrimaryImageItemId?: string;
    ImageTags?: {
        Primary?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface AlbumTrack {
    Id: string;
    Name: string;
    AlbumId?: string | null;
    Album?: string | null;
    AlbumArtist?: string | null;
    Artists?: string[];
    ArtistItems?: ArtistItem[];
    ProductionYear?: number | null;
    IndexNumber?: number | null;
    ParentIndexNumber?: number | null;
    RunTimeTicks?: number | null;
    HasLyrics?: boolean;
    Lyrics?: TrackLyrics;
    MediaStreams?: MediaStream[];
    Codec?: CodecInfo;
    PrimaryImageItemId?: string;
    [key: string]: unknown;
}

export interface Playlist {
    Id: string;
    Name: string;
    CanDelete?: boolean;
    ChildCount?: number | null;
    lastRefreshed?: number;
    Overview?: string;
    PrimaryImageItemId?: string;
    [key: string]: unknown;
}

export type SectionArtistItem = MusicArtist;
