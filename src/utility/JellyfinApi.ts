import { Track } from 'react-native-track-player';
import { AppState, useTypedSelector } from 'store';
import { AlbumTrack } from 'store/music/types';

type Credentials = AppState['settings']['jellyfin'];

function generateConfig(credentials: Credentials): RequestInit {
    return {
        headers: {
            'X-Emby-Authorization': `MediaBrowser Client="", Device="", DeviceId="", Version="", Token="${credentials?.access_token}"`
        }
    };
}

const baseTrackOptions: Record<string, string> = {
    // Not sure where this number refers to, but setting it to 140000000 appears
    // to do wonders for making stuff work
    // NOTE: Apparently setting a bitrate is as of yet unsupported in the
    // Jellyfin core, and hence this value is not used
    MaxStreamingBitrate: '140000000',
    MaxSampleRate: '48000',
    // This must be set to support client seeking
    TranscodingProtocol: 'hls',
    TranscodingContainer: 'ts',
    Container: 'mp3,aac,m4a,m4b|aac,alac,m4a,m4b|alac,flac|ogg',
    AudioCodec: 'aac',
    static: 'true',
};


/**
 * Generate a track object from a Jellyfin ItemId so that
 * react-native-track-player can easily consume it.
 */
export function generateTrack(track: AlbumTrack, credentials: Credentials): Track {
    // Also construct the URL for the stream
    const trackOptions = {
        ...baseTrackOptions,
        UserId: credentials?.user_id || '',
        api_key: credentials?.access_token || '',
        DeviceId: credentials?.device_id || '',
    };
    const trackParams = new URLSearchParams(trackOptions).toString();
    const url = encodeURI(`${credentials?.uri}/Audio/${track.Id}/universal?${trackParams}`);

    return {
        id: track.Id,
        url,
        title: track.Name,
        artist: track.Artists.join(', '),
        album: track.Album,
        artwork: track.AlbumId
            ? getImage(track.AlbumId, credentials)
            : getImage(track.Id, credentials),
    };
}

const albumOptions = {
    SortBy: 'AlbumArtist,SortName',
    SortOrder: 'Ascending',
    IncludeItemTypes: 'MusicAlbum',
    Recursive: 'true',
    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
};

const albumParams = new URLSearchParams(albumOptions).toString();

/**
 * Retrieve all albums that are available on the Jellyfin server
 */
export async function retrieveAlbums(credentials: Credentials) {
    const config = generateConfig(credentials);
    const albums = await fetch(`${credentials?.uri}/Users/${credentials?.user_id}/Items?${albumParams}`, config)
        .then(response => response.json());

    return albums.Items;
}

const latestAlbumsOptions = {
    IncludeItemTypes: 'MusicAlbum',
    Fields: 'DateCreated',
    SortOrder: 'Ascending',
};


/**
 * Retrieve the most recently added albums on the Jellyfin server 
 */
export async function retrieveRecentAlbums(credentials: Credentials, numberOfAlbums = 24) {
    const config = generateConfig(credentials);

    // Generate custom config based on function input
    const options = {
        ...latestAlbumsOptions,
        Limit: numberOfAlbums.toString(),
    };
    const params = new URLSearchParams(options).toString();

    // Retrieve albums
    const albums = await fetch(`${credentials?.uri}/Users/${credentials?.user_id}/Items/Latest?${params}`, config)
        .then(response => response.json());

    return albums;
}

/**
 * Retrieve a single album from the Emby server
 */
export async function retrieveAlbumTracks(ItemId: string, credentials: Credentials) {
    const singleAlbumOptions = {
        ParentId: ItemId,
        SortBy: 'SortName',
    };
    const singleAlbumParams = new URLSearchParams(singleAlbumOptions).toString();

    const config = generateConfig(credentials);
    const album = await fetch(`${credentials?.uri}/Users/${credentials?.user_id}/Items?${singleAlbumParams}`, config)
        .then(response => response.json());

    return album.Items;
}

export function getImage(ItemId: string, credentials: Credentials): string {
    return encodeURI(`${credentials?.uri}/Items/${ItemId}/Images/Primary?format=jpeg`);
}

export function useGetImage() {
    const credentials = useTypedSelector((state) => state.settings.jellyfin);
    return (ItemId: string) => getImage(ItemId, credentials);
}