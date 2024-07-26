import { AlbumTrack } from '@/store/music/types';
import { Platform } from 'react-native';
import { Track } from 'react-native-track-player';
import { fetchApi, getImage } from './lib';
import store from '@/store';
import {retrieveAndInjectLyricsToTracks} from '@/utility/JellyfinApi/lyrics';

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
    audioBitRate: '320000',
    ...trackOptionsOsOverrides[Platform.OS],
} as const;

/**
 * Generate the track streaming url from the trackId
 */
export function generateTrackUrl(trackId: string) {
    const credentials = store.getState().settings.credentials;
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

/**
 * Generate a track object from a Jellyfin ItemId so that
 * react-native-track-player can easily consume it.
 */
export async function generateTrack(track: AlbumTrack): Promise<Track> {
    // Also construct the URL for the stream
    const url = generateTrackUrl(track.Id);

    const response = await fetch(url, { method: 'HEAD' });

    return {
        url,
        backendId: track.Id,
        title: track.Name,
        artist: track.Artists.join(', '),
        album: track.Album,
        duration: track.RunTimeTicks,
        artwork: getImage(track.Id),
        hasLyrics: track.HasLyrics,
        lyrics: track.Lyrics,
        contentType: response.headers.get('Content-Type') || undefined,
        isDirectPlay: response.headers.has('Content-Length'),
        bitRate: baseTrackOptions.audioBitRate,
    };
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
export async function retrieveAllTracks() {
    return fetchApi<{ Items: AlbumTrack[] }>(({ user_id }) => `/Users/${user_id}/Items?${trackParams}`)
        .then((d) => retrieveAndInjectLyricsToTracks(d.Items));
}
