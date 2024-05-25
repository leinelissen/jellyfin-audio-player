import TrackPlayer, { RepeatMode, State, Track } from 'react-native-track-player';
import { AppState, useTypedSelector } from '@/store';
import { Album, AlbumTrack, SimilarAlbum } from '@/store/music/types';
import { Platform } from 'react-native';

type Credentials = AppState['settings']['jellyfin'];

/**
 * This is a convenience function that converts a set of Jellyfin credentials
 * from the Redux store to a HTTP Header that authenticates the user against the
 * Jellyfin server.
 */
function generateConfig(credentials: Credentials): RequestInit {
    return {
        headers: {
            'X-Emby-Authorization': `MediaBrowser Client="", Device="", DeviceId="", Version="", Token="${credentials?.access_token}"`
        }
    };
}

const trackOptionsOsOverrides: Record<typeof Platform.OS, Record<string, string>> = {
    ios: {
        Container: 'mp3,aac,m4a|aac,m4b|aac,flac,alac,m4a|alac,m4b|alac,wav,m4a,aiff,aif',
    },
    android: {
        Container: 'mp3,aac,flac,wav,ogg,ogg|vorbis,ogg|opus,mka|mp3,mka|opus,mka|mp3',
    },
    macos: {},
    web: {},
    windows: {},
};

const baseTrackOptions: Record<string, string> = {
    TranscodingProtocol: 'http',
    TranscodingContainer: 'aac',
    AudioCodec: 'aac',
    Container: 'mp3,aac',
    ...trackOptionsOsOverrides[Platform.OS],
};

/**
 * Generate a track object from a Jellyfin ItemId so that
 * react-native-track-player can easily consume it.
 */
export function generateTrack(track: AlbumTrack, credentials: Credentials): Track {
    // Also construct the URL for the stream
    const url = generateTrackUrl(track.Id, credentials);

    return {
        url,
        backendId: track.Id,
        title: track.Name,
        artist: track.Artists.join(', '),
        album: track.Album,
        duration: track.RunTimeTicks,
        artwork: track.AlbumId
            ? getImage(track.AlbumId, credentials)
            : getImage(track.Id, credentials),
    };
}

/**
 * Generate the track streaming url from the trackId
 */
export function generateTrackUrl(trackId: string, credentials: Credentials) {
    const trackOptions = {
        ...baseTrackOptions,
        UserId: credentials?.user_id || '',
        api_key: credentials?.access_token || '',
        DeviceId: credentials?.device_id || '',
    };

    const trackParams = new URLSearchParams(trackOptions).toString();
    const url = encodeURI(`${credentials?.uri}/Audio/${trackId}/universal?`) + trackParams;

    return url;
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
export async function retrieveAllAlbums(credentials: Credentials) {
    const config = generateConfig(credentials);
    const albums = await fetch(`${credentials?.uri}/Users/${credentials?.user_id}/Items?${albumParams}`, config)
        .then(response => {
            if (response.ok) return response.json();
            throw response;
        });

    return albums.Items;
}

/**
 * Retrieve a single album
 */
export async function retrieveAlbum(credentials: Credentials, id: string): Promise<Album> {
    const config = generateConfig(credentials);

    const Similar = await fetch(`${credentials?.uri}/Items/${id}/Similar?userId=${credentials?.user_id}&limit=12`, config)
        .then(response => {
            if (response.ok) {
                return response.json() as Promise<{ Items: SimilarAlbum[] }>;
            } 

            throw response;
        }).then((albums) => albums.Items.map((a) => a.Id));

    return fetch(`${credentials?.uri}/Users/${credentials?.user_id}/Items/${id}`, config)
        .then(response => response.json() as Promise<Album>)
        .then(album => ({ ...album, Similar }));
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
        .then(response => {
            if (response.ok) return response.json();
            throw response;
        });

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
        .then(response => {
            if (response.ok) return response.json();
            throw response;
        });

    return album.Items;
}

/**
 * Retrieve an image URL for a given ItemId
 */
export function getImage(ItemId: string, credentials: Credentials): string {
    return encodeURI(`${credentials?.uri}/Items/${ItemId}/Images/Primary?format=jpeg`);
}

/**
 * Create a hook that can convert ItemIds to image URLs
 */
export function useGetImage() {
    const credentials = useTypedSelector((state) => state.settings.jellyfin);
    return (ItemId: string) => getImage(ItemId, credentials);
}

const trackParams = {
    SortBy: 'AlbumArtist,SortName',
    SortOrder: 'Ascending',
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated',
};

/**
 * Retrieve all possible tracks that can be found in Jellyfin
 */
export async function retrieveAllTracks(credentials: Credentials) {
    const config = generateConfig(credentials);
    const tracks = await fetch(`${credentials?.uri}/Users/${credentials?.user_id}/Items?${trackParams}`, config)
        .then(response => {
            if (response.ok) return response.json();
            throw response;
        });

    return tracks.Items;
}

const searchParams = {
    IncludeItemTypes: 'Audio,MusicAlbum',
    SortBy: 'Album,SortName',
    SortOrder: 'Ascending',
    Recursive: 'true',
};

/**
 * Remotely search the Jellyfin library for a particular search term
 */
export async function searchItem(
    credentials: Credentials,
    term: string, limit = 24
): Promise<(Album | AlbumTrack)[]> {
    const config = generateConfig(credentials);

    const params = new URLSearchParams({
        ...searchParams,
        SearchTerm: term,
        Limit: limit.toString(),
    }).toString();

    const results = await fetch(`${credentials?.uri}/Users/${credentials?.user_id}/Items?${params}`, config)
        .then(response => {
            if (response.ok) {
                return response.json() as Promise<{ Items: (Album | AlbumTrack)[] }>;
            }

            throw response;
        });

    return results.Items
        .filter((item) => (
            // GUARD: Ensure that we're either dealing with an album or a track from an album.
            item.Type === 'MusicAlbum' || (item.Type === 'Audio' && item.AlbumId)
        ));
}

const playlistOptions = {
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
    MediaTypes: 'Audio',
};

/**
 * Retrieve all albums that are available on the Jellyfin server
 */
export async function retrieveAllPlaylists(credentials: Credentials) {
    const config = generateConfig(credentials);
    const playlistParams = new URLSearchParams(playlistOptions).toString();
    
    const albums = await fetch(`${credentials?.uri}/Users/${credentials?.user_id}/Items?${playlistParams}`, config)
        .then(response => {
            if (response.ok) return response.json();
            throw response;
        });

    return albums.Items;
}

/**
 * Retrieve all albums that are available on the Jellyfin server
 */
export async function retrievePlaylistTracks(ItemId: string, credentials: Credentials) {
    const singlePlaylistOptions = {
        SortBy: 'SortName',
        UserId: credentials?.user_id || '',
    };
    const singlePlaylistParams = new URLSearchParams(singlePlaylistOptions).toString();

    const config = generateConfig(credentials);
    const playlists = await fetch(`${credentials?.uri}/Playlists/${ItemId}/Items?${singlePlaylistParams}`, config)
        .then(response => {
            if (response.ok) return response.json();
            throw response;
        });

    return playlists.Items;
}

/**
 * This maps the react-native-track-player RepeatMode to a RepeatMode that is
 * expected by Jellyfin when reporting playback events.
 */
const RepeatModeMap: Record<RepeatMode, string> = {
    [RepeatMode.Off]: 'RepeatNone',
    [RepeatMode.Track]: 'RepeatOne',
    [RepeatMode.Queue]: 'RepeatAll',
};

/**
 * This will generate the payload that is required for playback events and send
 * it to the supplied path.
 */
export async function sendPlaybackEvent(path: string, credentials: Credentials, trackIndex?: number) {
    // Extract all data from react-native-track-player
    const [
        currentTrack, position, repeatMode, volume, queue, state,
    ] = await Promise.all([
        TrackPlayer.getCurrentTrack(),
        TrackPlayer.getPosition(),
        TrackPlayer.getRepeatMode(),
        TrackPlayer.getVolume(),
        TrackPlayer.getQueue(),
        TrackPlayer.getState(),
    ]);

    // Switch between overriden track index and current track
    const track = trackIndex !== undefined ? trackIndex : currentTrack;

    // Generate a payload from the gathered data
    const payload = {
        VolumeLevel: volume * 100,
        IsMuted: false,
        IsPaused: state === State.Paused,
        RepeatMode: RepeatModeMap[repeatMode],
        ShuffleMode: 'Sorted',
        PositionTicks: Math.round(position * 10_000_000),
        PlaybackRate: 1,
        PlayMethod: 'transcode',
        MediaSourceId: track !== null ? queue[track].backendId : null,
        ItemId: track !== null ? queue[track].backendId : null,
        CanSeek: true,
        PlaybackStartTimeTicks: null,
    };

    // Generate a config from the credentials and dispatch the request
    const config = generateConfig(credentials);
    await fetch(`${credentials?.uri}${path}`, { 
        method: 'POST',
        headers: {
            ...config.headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
    // Swallow and errors from the request
    }).catch((err) => {
        console.error(err);
    });
}