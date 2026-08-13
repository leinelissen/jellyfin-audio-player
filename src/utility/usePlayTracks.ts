import { useCallback } from 'react';
import TrackPlayer, { type Track } from 'react-native-track-player';
import { shuffle as shuffleArray } from 'lodash';
import { generateTrack } from './track';
import type { TrackWithDownload } from '@/store/tracks/hooks';
import type { Download } from '@/store/downloads/types';

export interface PlayOptions {
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
 * Core playback logic. Accepts a list of tracks (each with its download row
 * attached), generates a react-native-track-player entry for each one
 * (swapping in a local file URL when a completed download exists) and hands
 * the queue off to TrackPlayer.
 */
export async function playTracks(
    tracks: TrackWithDownload[] | undefined,
    options: Partial<PlayOptions> = {},
): Promise<Track[] | undefined> {
    if (!tracks?.length) {
        return;
    }

    const { play, shuffle, method } = { ...defaults, ...options };

    const generatedTracks = (
        await Promise.all(
            tracks.map(async ({ download: rawDownload, ...track }) => {
                const download = rawDownload as Download | null;
                const generatedTrack = await generateTrack(track);

                if (download?.isComplete && download.filename) {
                    generatedTrack.url = 'file://' + download.filename;
                }
                if (download?.image) {
                    generatedTrack.artwork = 'file://' + download.image;
                }

                return generatedTrack;
            }),
        )
    ).filter((t): t is Track => t !== undefined);

    const newTracks = shuffle ? shuffleArray(generatedTracks) : generatedTracks;

    switch (method) {
        case 'add-to-end': {
            await TrackPlayer.add(newTracks);
            if (play) {
                await TrackPlayer.skip(
                    (await TrackPlayer.getQueue()).length - newTracks.length,
                );
                await TrackPlayer.play();
            }
            break;
        }

        case 'add-after-currently-playing': {
            const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
            if (currentTrackIndex === undefined) break;

            await TrackPlayer.add(newTracks, currentTrackIndex + 1);
            if (play) {
                await TrackPlayer.skip(currentTrackIndex + 1);
                await TrackPlayer.play();
            }
            break;
        }

        case 'replace': {
            await TrackPlayer.reset();

            if (options.playIndex !== undefined) {
                const before = newTracks.slice(0, options.playIndex);
                const current = newTracks.slice(options.playIndex);

                await TrackPlayer.add(current);
                if (play) {
                    await TrackPlayer.play();
                }
                await TrackPlayer.add(before, 0);
            } else {
                await TrackPlayer.add(newTracks);
                if (play) {
                    await TrackPlayer.play();
                }
            }
            break;
        }
    }

    return newTracks;
}

/**
 * React hook that returns a stable callback wrapping playTracks.
 */
export default function usePlayTracks() {
    return useCallback(
        (tracks: TrackWithDownload[] | undefined, options: Partial<PlayOptions> = {}) =>
            playTracks(tracks, options),
        [],
    );
}