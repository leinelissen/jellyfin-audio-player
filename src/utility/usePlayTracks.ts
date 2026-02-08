import { useCallback } from 'react';
import TrackPlayer, { Track } from 'react-native-track-player';
import { shuffle as shuffleArray } from 'lodash';
import { generateTrack } from './JellyfinApi/track';
import { useTracks } from '@/store/music/hooks';
import { useDownloads } from '@/store/downloads/hooks';
import { useSourceId } from '@/store/db/useSourceId';
import type { AlbumTrack } from '@/store/music/types';
import type { DownloadWithMetadata } from '@/store/downloads/db';
import type { DownloadEntity } from '@/store/downloads/types';

// Union type to support both database and Redux formats (for CarPlay compatibility)
type DownloadRecord = Record<string, DownloadWithMetadata | DownloadEntity>;

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
 * Core playback logic that can be used outside of React components
 * Used by both usePlayTracks hook and CarPlay templates
 */
export async function playTracks(
    trackIds: string[] | undefined,
    tracks: Record<string, AlbumTrack>,
    downloads: DownloadRecord,
    options: Partial<PlayOptions> = {},
): Promise<Track[] | undefined> {
    if (!trackIds) {
        return;
    }

    // GUARD: Check options and queue
    const {
        play,
        shuffle,
        method,
    } = Object.assign({}, defaults, options);

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
        if (download?.isComplete) {
            // Handle both old Redux format (location) and new DB format (filename)
            const audioPath = download.filename || download.location;
            if (audioPath) {
                generatedTrack.url = 'file://' + audioPath;
            }
        }
        // Check for downloaded image (both old and new format)
        if (download?.image) {
            generatedTrack.artwork = 'file://' + download.image;
        }

        return generatedTrack;
    }))).filter((t): t is Track => typeof t !== 'undefined');

    // Potentially shuffle all tracks
    const newTracks = shuffle ? shuffleArray(generatedTracks) : generatedTracks;

    console.log('[playTracks] Generated tracks:', newTracks.length, 'tracks');
    console.log('[playTracks] First track URL:', newTracks[0]?.url);

    // Then, we'll need to check where to add the track
    switch(method) {
        case 'add-to-end': {
            await TrackPlayer.add(newTracks);
            console.log('[playTracks] Added tracks to end, queue size:', (await TrackPlayer.getQueue()).length);

            // Then we'll skip to it and play it
            if (play) {
                await TrackPlayer.skip((await TrackPlayer.getQueue()).length - newTracks.length);
                await TrackPlayer.play();
                console.log('[playTracks] Playback started');
            }

            break;
        }
        case 'add-after-currently-playing': {
            // Try and locate the current track
            const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();

            if (currentTrackIndex === undefined) {
                break;
            }
            
            // TrackPlayer.add wants the index of the track to insert in front of,
            // or just one more
            const targetTrack = currentTrackIndex + 1;

            // Depending on whether this track exists, we either add it there,
            // or at the end of the queue.
            await TrackPlayer.add(newTracks, targetTrack);
            console.log('[playTracks] Added tracks after current');

            if (play) {
                await TrackPlayer.skip(currentTrackIndex + 1);
                await TrackPlayer.play();
                console.log('[playTracks] Playback started');
            }

            break;
        }
        case 'replace': {
            // Reset the queue first
            await TrackPlayer.reset();
            console.log('[playTracks] Queue reset');

            // GUARD: Check if we need to skip to a particular index
            if (options.playIndex !== undefined) {
                // If so, we'll split the tracks into tracks before the
                // index that should be played, and the queue of tracks that
                // will start playing
                const before = newTracks.slice(0, options.playIndex);
                const current = newTracks.slice(options.playIndex);

                // First, we'll add the current queue and (optionally) force
                // it to start playing.
                await TrackPlayer.add(current);
                console.log('[playTracks] Added current tracks, starting at index:', options.playIndex);
                if (play) {
                    await TrackPlayer.play();
                    console.log('[playTracks] Playback started');
                }

                // Then, we'll insert the "previous" tracks after the queue
                // has started playing. This ensures that these tracks won't
                // trigger any events on the track player.
                await TrackPlayer.add(before, 0);
            } else {
                await TrackPlayer.add(newTracks);
                console.log('[playTracks] Added all tracks, queue size:', (await TrackPlayer.getQueue()).length);
                if (play) {
                    await TrackPlayer.play();
                    const state = await TrackPlayer.getPlaybackState();
                    console.log('[playTracks] Playback started, state:', state);
                }
            }

            break;
        }
    }

    return newTracks;
}

/**
 * Generate a callback function that starts playing a full album given its
 * supplied id.
 */
export default function usePlayTracks() {
    const sourceId = useSourceId();
    const { tracks: tracksEntities } = useTracks(sourceId);
    const { entities: downloadsEntities } = useDownloads(sourceId);

    return useCallback(
        (trackIds: string[] | undefined, options: Partial<PlayOptions> = {}) =>
            playTracks(trackIds, tracksEntities, downloadsEntities, options),
        [downloadsEntities, tracksEntities]
    );
}