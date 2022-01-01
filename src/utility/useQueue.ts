import { useCallback, useEffect, useState } from 'react';
import TrackPlayer, { Event, Track, useTrackPlayerEvents } from 'react-native-track-player';
import { useOnTrackAdded } from './AddedTrackEvents';
import useCurrentTrack from './useCurrentTrack';

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
export function useHasNextQueue(): boolean {
    const { index } = useCurrentTrack();
    const queue = useQueue();

    return queue?.length > 1 && (index || 0) < (queue.length - 1);
}

/**
 * Shorthand helper to determine whether a queue exists
 */
export function useHasPreviousQueue(): boolean {
    const { index } = useCurrentTrack();
    const queue = useQueue();

    return queue?.length > 1 && (index || 0) > 0;
}