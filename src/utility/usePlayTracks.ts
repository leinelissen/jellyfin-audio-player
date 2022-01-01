import { useTypedSelector } from 'store';
import { useCallback } from 'react';
import TrackPlayer, { Track } from 'react-native-track-player';
import { generateTrack } from './JellyfinApi';
import { EntityId } from '@reduxjs/toolkit';
import { shuffle as shuffleArray } from 'lodash';

/**
 * Generate a callback function that starts playing a full album given its
 * supplied id.
 */
export default function usePlayTracks() {
    const credentials = useTypedSelector(state => state.settings.jellyfin);
    const tracks = useTypedSelector(state => state.music.tracks.entities);

    return useCallback(async function playTracks(
        trackIds: EntityId[] | undefined,
        play: boolean = true,
        shuffle: boolean = false,
    ): Promise<Track[] | undefined> {
        if (!trackIds) {
            return;
        }

        // Convert all trackIds to the relevant format for react-native-track-player
        const newTracks = trackIds.map((trackId) => {
            const track = tracks[trackId];

            if (!trackId || !track) {
                return;
            }

            return generateTrack(track, credentials);
        }).filter((t): t is Track => typeof t !== 'undefined');

        // Clear the queue and add all tracks
        await TrackPlayer.reset();
        await TrackPlayer.add(shuffle ? shuffleArray(newTracks) : newTracks);

        // Play the queue
        if (play) {
            await TrackPlayer.play();
        }

        return newTracks;
    }, [credentials, tracks]);
}