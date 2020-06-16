import { Track } from 'react-native-track-player';

const JELLYFIN_SERVER = '***REMOVED***';
const API_KEY = '***REMOVED***';
const DEVICE_ID =
  '***REMOVED***';
const USER_ID = '***REMOVED***';

const trackOptions: Record<string, string> = {
    DeviceId: DEVICE_ID,
    UserId: USER_ID,
    api_key: API_KEY,
    // Not sure where this number refers to, but setting it to 140000000 appears
    // to do wonders for making stuff work
    MaxStreamingBitrate: '140000000',
    MaxSampleRate: '48000',
    // This must be set to support client seeking
    TranscodingProtocol: 'hls',
    TranscodingContainer: 'ts',
    // NOTE: We cannot send a comma-delimited list yet due to an issue with
    // react-native-track-player. This is set to be merged and released very
    // soon: https://github.com/react-native-kit/react-native-track-player/pull/950
    // Container: 'mp3',
    Container: 'mp3,aac,m4a,m4b|aac,alac,m4a,m4b|alac',
    AudioCodec: 'aac',
    static: 'true',
    // These last few options appear to be redundant
    // EnableRedirection: 'true',
    // EnableRemoteMedia: 'false',
    // // this should be generated client-side and is intended to be a unique value per stream URL
    // PlaySessionId: Math.floor(Math.random() * 10000000).toString(),
    // StartTimeTicks: '0',
};

const trackParams = new URLSearchParams(trackOptions).toString();

/**
 * Generate a track object from a Jellyfin ItemId so that
 * react-native-track-player can easily consume it.
 */
export async function generateTrack(ItemId: string): Promise<Track> {
    // First off, fetch all the metadata for this particular track from the
    // Jellyfin server
    const track = await fetch(`${JELLYFIN_SERVER}/Users/${USER_ID}/Items/${ItemId}?api_key=${API_KEY}`)
        .then(response => response.json());

    // Also construct the URL for the stream
    const url = encodeURI(`${JELLYFIN_SERVER}/Audio/${ItemId}/universal.mp3?${trackParams}`);

    return {
        id: ItemId,
        url,
        title: track.Name,
        artist: track.Artists.join(', '),
        album: track.Album,
        genre: Array.isArray(track.Genres) ? track.Genres[0] : undefined,
        artwork: getImage(ItemId),
    };
}

const albumOptions = {
    SortBy: 'AlbumArtist,SortName',
    SortOrder: 'Ascending',
    IncludeItemTypes: 'MusicAlbum',
    Recursive: 'true',
    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
    api_key: API_KEY,
    // StartIndex: '0',
    // Limit: '100',
    // ParentId: '7e64e319657a9516ec78490da03edccb',
};

const albumParams = new URLSearchParams(albumOptions).toString();

/**
 * Retrieve all albums that are available on the Jellyfin server
 */
export async function retrieveAlbums() {
    const albums = await fetch(`${JELLYFIN_SERVER}/Users/${USER_ID}/Items?${albumParams}`)
        .then(response => response.json());

    return albums.Items;
}

/**
 * Retrieve a single album from the Emby server
 */
export async function retrieveAlbumTracks(ItemId: string) {
    const singleAlbumOptions = {
        ParentId: ItemId,
        SortBy: 'SortName',
        api_key: API_KEY,    
    };
    const singleAlbumParams = new URLSearchParams(singleAlbumOptions).toString();

    const album = await fetch(`${JELLYFIN_SERVER}/Users/${USER_ID}/Items?${singleAlbumParams}`)
        .then(response => response.json());

    return album.Items;
}

export function getImage(ItemId: string): string {
    return encodeURI(`${JELLYFIN_SERVER}/Items/${ItemId}/Images/Primary?format=jpeg`);
}