import { useCallback, useEffect, useState } from 'react';
import TrackPlayer, { Event, Track, useTrackPlayerEvents } from 'react-native-track-player';
import { useOnTrackAdded } from './AddedTrackEvents';

/**
 * This hook retrieves the current playing track from TrackPlayer
 */
export default function useQueue(): Track[] {
    const [queue, setQueue] = useState<Track[]>([]);

    // Define function that fetches the current queue
    const updateQueue = useCallback(() => TrackPlayer.getQueue().then(setQueue), [setQueue]);

    // Then define the triggers for updating it
    useEffect(() => { updateQueue(); }, [updateQueue]);
    useTrackPlayerEvents([ 
        Event.PlaybackState,
    ], updateQueue);
    useOnTrackAdded(updateQueue);

    return queue;
}

/**
 * Shorthand helper to determine whether a queue exists
 */
export function useHasQueue(): boolean {
    const queue = useQueue();
    return !!queue && queue.length > 1;
}