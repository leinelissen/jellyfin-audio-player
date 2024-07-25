import { fetchApi } from './lib';
import {AlbumTrack} from '@/store/music/types.ts';

interface Metadata {
    Artist: string
    Album: string
    Title: string
    Author: string
    Length: number
    By: string
    Offset: number
    Creator: string
    Version: string
    IsSynced: boolean
}

interface LyricData {
    Text: string
    Start: number
}

export interface Lyrics {
    Metadata: Metadata
    Lyrics: LyricData[]
}

async function retrieveTrackLyrics(trackId: string): Promise<Lyrics | null> {
    return fetchApi<Lyrics>(`/Audio/${trackId}/Lyrics`)
        .catch((e) => {
            console.error('Error on fetching track lyrics: ', e);
            return null;
        });
}


export async function retrieveAndInjectLyricsToTracks(tracks: AlbumTrack[]): Promise<AlbumTrack[]> {
    return Promise.all(tracks.map(async (track) => {
        if (!track.HasLyrics) {
            track.Lyrics = null;
            return track;
        }

        track.Lyrics = await retrieveTrackLyrics(track.Id);

        return track;

    }));
}
