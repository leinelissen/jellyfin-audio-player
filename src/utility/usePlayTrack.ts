import { useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { useTypedSelector } from 'store';
import { generateTrack } from './JellyfinApi';
import useQueue from './useQueue';

/**
 * A hook that generates a callback that can setup and start playing a
 * particular trackId in the player.
 */
export default function usePlayTrack() {
    const credentials = useTypedSelector(state => state.settings.jellyfin);
    const tracks = useTypedSelector(state => state.music.tracks.entities);
    const queue = useQueue();

    return useCallback(async function playTrack(trackId: string) {
        // Get the relevant track
        const track = tracks[trackId];

        // GUARD: Check if the track actually exists in the store
        if (!track) {
            return;
        }

        // GUARD: Check if the track is already in the queue
        if (!queue?.some((t) => t.id === trackId)) {
            // If it is not, we must then generate it, and add it to the queue
            const newTrack = generateTrack(track, credentials);
            await TrackPlayer.add([ newTrack ]);
        }

        // Then we'll skip to it and play it
        await TrackPlayer.skip(trackId);
        TrackPlayer.play();
    }, [credentials, tracks]);
}