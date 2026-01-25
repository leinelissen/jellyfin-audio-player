import { useTypedSelector } from '@/store';
import { useCallback } from 'react';
import TrackPlayer, { Track } from 'react-native-track-player';
import { shuffle as shuffleArray } from 'lodash';
import { generateTrack } from './JellyfinApi/track';

interface PlayOptions {
    play: boolean;
    shuffle: boolean;
    method: 'add-to-end' | 'add-after-currently-playing' | 'replace';
    /** 
     * The index for the track that should start out playing. This ensures that
     * no intermediate tracks are played (however briefly) while the queue skips
     * to this index.
     * 
     * NOTE: This option is only available with the `replace` method. 
     */
    playIndex?: number;
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
        const generatedTracks = (await Promise.all(trackIds.map(async (trackId) => {
            const track = tracks[trackId];

            // GUARD: Check that the track actually exists in Redux
            if (!trackId || !track) {
                return;
            }

            // Retrieve the generated track from Jellyfin
            const generatedTrack = await generateTrack(track);

            // Check if a downloaded version exists, and if so rewrite the URL
            const download = downloads[trackId];
            if (download?.location) {
                generatedTrack.url = 'file://' + download.location;
            }
            if (download?.image) {
                generatedTrack.artwork = 'file://' + download.image;
            }

            return generatedTrack;
        }))).filter((t): t is Track => typeof t !== 'undefined');

        // Potentially shuffle all tracks
        const newTracks = shuffle ? shuffleArray(generatedTracks) : generatedTracks;

        console.log('[usePlayTracks] Generated tracks:', newTracks.length, 'tracks');
        console.log('[usePlayTracks] First track URL:', newTracks[0]?.url);

        // Then, we'll need to check where to add the track
        switch(method) {
            case 'add-to-end': {
                await TrackPlayer.add(newTracks);
                console.log('[usePlayTracks] Added tracks to end, queue size:', (await TrackPlayer.getQueue()).length);

                // Then we'll skip to it and play it
                if (play) {
                    await TrackPlayer.skip((await TrackPlayer.getQueue()).length - newTracks.length);
                    await TrackPlayer.play();
                    console.log('[usePlayTracks] Playback started');
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
                console.log('[usePlayTracks] Added tracks after current');
    
                if (play) {
                    await TrackPlayer.skip(currentTrackIndex + 1);
                    await TrackPlayer.play();
                    console.log('[usePlayTracks] Playback started');
                }

                break;
            }
            case 'replace': {
                // Reset the queue first
                await TrackPlayer.reset();
                console.log('[usePlayTracks] Queue reset');

                // GUARD: Check if we need to skip to a particular index
                if (options.playIndex) {
                    // If so, we'll split the tracks into tracks before the
                    // index that should be played, and the queue of tracks that
                    // will start playing
                    const before = newTracks.slice(0, options.playIndex);
                    const current = newTracks.slice(options.playIndex);

                    // First, we'll add the current queue and (optionally) force
                    // it to start playing.
                    await TrackPlayer.add(current);
                    console.log('[usePlayTracks] Added current tracks, starting at index:', options.playIndex);
                    if (play) {
                        await TrackPlayer.play();
                        console.log('[usePlayTracks] Playback started');
                    }

                    // Then, we'll insert the "previous" tracks after the queue
                    // has started playing. This ensures that these tracks won't
                    // trigger any events on the track player.
                    await TrackPlayer.add(before, 0);
                } else {
                    await TrackPlayer.add(newTracks);
                    console.log('[usePlayTracks] Added all tracks, queue size:', (await TrackPlayer.getQueue()).length);
                    if (play) {
                        await TrackPlayer.play();
                        const state = await TrackPlayer.getPlaybackState();
                        console.log('[usePlayTracks] Playback started, state:', state);
                    }
                }

                break;
            }
        }
    }, [downloads, tracks]);
}