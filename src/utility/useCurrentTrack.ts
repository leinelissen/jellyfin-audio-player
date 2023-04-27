import { useCallback, useEffect, useState } from 'react';
import TrackPlayer, { Event, Track, useTrackPlayerEvents } from 'react-native-track-player';

interface CurrentTrackResponse {
    track: Track | undefined;
    index: number | undefined;
}

/**
 * This hook retrieves the current playing track from TrackPlayer
 */
export default function useCurrentTrack(): CurrentTrackResponse {
    const [track, setTrack] = useState<Track | undefined>();
    const [index, setIndex] = useState<number | undefined>();

    // Retrieve the current track from the queue using the index
    const retrieveCurrentTrack = useCallback(async () => {
        const queue = await TrackPlayer.getQueue();
        const currentTrackIndex = await TrackPlayer.getCurrentTrack();
        if (currentTrackIndex !== null) {
            setTrack(queue[currentTrackIndex]);
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