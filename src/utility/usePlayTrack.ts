import { useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { useTypedSelector } from 'store';
import { generateTrack } from './JellyfinApi';
import useQueue from './useQueue';
import { useDispatch } from 'react-redux';
import player from 'store/player';

/**
 * A hook that generates a callback that can setup and start playing a
 * particular trackId in the player.
 */
export default function usePlayTrack() {
    const dispatch = useDispatch();
    const credentials = useTypedSelector(state => state.settings.jellyfin);
    const tracks = useTypedSelector(state => state.music.tracks.entities);
    const queue = useQueue();

    return useCallback(async function playTrack(trackId: string, play = true, addToEnd = true) {
        // Get the relevant track
        const track = tracks[trackId];

        // GUARD: Check if the track actually exists in the store
        if (!track) {
            return;
        }

        // GUARD: Check if the track is already in the queue
        const trackInstances = queue.filter((t) => t.id.startsWith(trackId));

        // Generate the new track for the queue
        const newTrack = {
            ...(trackInstances.length ? trackInstances[0] : generateTrack(track, credentials)),
            id: `${trackId}_${trackInstances.length}`
        };

        // Then, we'll need to check where to add the track
        if (addToEnd) {
            await TrackPlayer.add([ newTrack ]);
        } else {
            // Try and locate the current track
            const currentTrackId = await TrackPlayer.getCurrentTrack();
            const currentTrackIndex = queue.findIndex(track => track.id === currentTrackId);
            
            // Since the argument is the id to insert the track BEFORE, we need
            // to get the current track + 1
            const targetTrack = currentTrackIndex >= 0 && queue.length > 1
                ? queue[currentTrackIndex + 1].id
                : undefined;
            
            // Depending on whether this track exists, we either add it there,
            // or at the end of the queue.
            await TrackPlayer.add([ newTrack ], targetTrack);
        }

        // Then, we'll dispatch the added track event
        dispatch(player.actions.addNewTrackToPlayer());

        // Then we'll skip to it and play it
        if (play) {
            await TrackPlayer.skip(newTrack.id);
            await TrackPlayer.play();
        }

        return newTrack;
    }, [credentials, tracks, queue, dispatch]);
}