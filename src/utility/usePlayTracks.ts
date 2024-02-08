import { useTypedSelector } from '@/store';
import { useCallback } from 'react';
import TrackPlayer, { Track } from 'react-native-track-player';
import { generateTrack } from './JellyfinApi';
import { shuffle as shuffleArray } from 'lodash';

interface PlayOptions {
    play: boolean;
    shuffle: boolean;
    method: 'add-to-end' | 'add-after-currently-playing' | 'replace';
}

const defaults: PlayOptions = {
    play: true,
    shuffle: false,
    method: 'replace',
};

/**
 * Generate a callback function that starts playing a full album given its
 * supplied id.
 */
export default function usePlayTracks() {
    const credentials = useTypedSelector(state => state.settings.jellyfin);
    const tracks = useTypedSelector(state => state.music.tracks.entities);
    const downloads = useTypedSelector(state => state.downloads.entities);

    return useCallback(async function playTracks(
        trackIds: string[] | undefined,
        options: Partial<PlayOptions> = {},
    ): Promise<Track[] | undefined> {
        if (!trackIds) {
            return;
        }

        // Retrieve options and queue
        const {
            play,
            shuffle,
            method,
        } = Object.assign({}, defaults, options);
        const queue = await TrackPlayer.getQueue();

        // Convert all trackIds to the relevant format for react-native-track-player
        const generatedTracks = trackIds.map((trackId) => {
            const track = tracks[trackId];

            // GUARD: Check that the track actually exists in Redux
            if (!trackId || !track) {
                return;
            }

            // Retrieve the generated track from Jellyfin
            const generatedTrack = generateTrack(track, credentials);

            // Check if a downloaded version exists, and if so rewrite the URL
            const download = downloads[trackId];
            if (download?.location) {
                generatedTrack.url = 'file://' + download.location;
            }

            return generatedTrack;
        }).filter((t): t is Track => typeof t !== 'undefined');

        // Potentially shuffle all tracks
        const newTracks = shuffle ? shuffleArray(generatedTracks) : generatedTracks;

        // Then, we'll need to check where to add the track
        switch(method) {
            case 'add-to-end': {
                await TrackPlayer.add(newTracks);

                // Then we'll skip to it and play it
                if (play) {
                    await TrackPlayer.skip((await TrackPlayer.getQueue()).length - newTracks.length);
                    await TrackPlayer.play();
                }

                break;
            }
            case 'add-after-currently-playing': {
                // Try and locate the current track
                const currentTrackIndex = await TrackPlayer.getCurrentTrack();

                if (currentTrackIndex === null) {
                    break;
                }
                
                // Since the argument is the id to insert the track BEFORE, we need
                // to get the current track + 1
                const targetTrack = currentTrackIndex >= 0 && queue.length > 1
                    ? queue[currentTrackIndex + 1].id
                    : undefined;
                
                // Depending on whether this track exists, we either add it there,
                // or at the end of the queue.
                await TrackPlayer.add(newTracks, targetTrack);
    
                if (play) {
                    await TrackPlayer.skip(currentTrackIndex + 1);
                    await TrackPlayer.play();
                }

                break;
            }
            case 'replace': {
                await TrackPlayer.reset();
                await TrackPlayer.add(newTracks);

                if (play) {
                    await TrackPlayer.play();
                }

                break;
            }
        }
    }, [credentials, downloads, tracks]);
}