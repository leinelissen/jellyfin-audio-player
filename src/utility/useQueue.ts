import { useEffect, useState } from 'react';
import TrackPlayer, { usePlaybackState, Track } from 'react-native-track-player';
import { useTypedSelector } from 'store';

/**
 * This hook retrieves the current playing track from TrackPlayer
 */
export default function useQueue(): Track[] {
    const state = usePlaybackState();
    const [queue, setQueue] = useState<Track[]>([]);
    const addedTrackCount = useTypedSelector(state => state.player);

    useEffect(() => {
        TrackPlayer.getQueue().then(setQueue);
    }, [state, addedTrackCount]);

    return queue;
}

/**
 * Shorthand helper to determine whether a queue exists
 */
export function useHasQueue(): boolean {
    const queue = useQueue();
    return !!queue && queue.length > 1;
}