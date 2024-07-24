import { useCallback, useEffect, useState } from 'react';
import TrackPlayer, { Event, Track, useTrackPlayerEvents } from 'react-native-track-player';
import {Lyrics} from '@/utility/JellyfinApi/lyrics';


// TODO need review

interface TrackWithLyrics extends Track {
    hasLyrics: boolean;
    lyrics: Lyrics
}

interface CurrentTrackResponse {
    track: TrackWithLyrics | undefined;
    index: number | undefined;
}

/**
 * This hook retrieves the current playing track from TrackPlayer
 */
export default function useCurrentTrack(): CurrentTrackResponse {
    const [track, setTrack] = useState<TrackWithLyrics | undefined>();
    const [index, setIndex] = useState<number | undefined>();

    // Retrieve the current track from the queue using the index
    const retrieveCurrentTrack = useCallback(async () => {
        const queue = await TrackPlayer.getQueue();
        const currentTrackIndex = await TrackPlayer.getCurrentTrack();
        if (currentTrackIndex !== null) {
            setTrack(queue[currentTrackIndex] as TrackWithLyrics);
            setIndex(currentTrackIndex);
        } else {
            setTrack(undefined);
            setIndex(undefined);
        }
    }, [setTrack, setIndex]);

    // Then execute the function on component mount and track changes
    useEffect(() => { retrieveCurrentTrack(); }, [retrieveCurrentTrack]);
    useTrackPlayerEvents([ Event.PlaybackTrackChanged, Event.PlaybackState ], retrieveCurrentTrack);

    return { track, index };
}
