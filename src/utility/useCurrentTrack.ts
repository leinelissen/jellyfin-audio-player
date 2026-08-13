import { useTrack } from '@/store/tracks/hooks';
import type { Track as DbTrack } from '@/store/tracks/types';
import { useEffect, useState } from 'react';
import TrackPlayer, { Event, useTrackPlayerEvents, Track } from 'react-native-track-player';

interface CurrentTrackResponse {
    track: Track | undefined;
    albumTrack: DbTrack | undefined | null;
    index: number | undefined;
}

/**
 * This hook retrieves the current playing track from TrackPlayer, and looks
 * up the corresponding database record using the track's entityId.
 */
export default function useCurrentTrack(): CurrentTrackResponse {
    const [track, setTrack] = useState<Track | undefined>();
    const [index, setIndex] = useState<number | undefined>();

    // Look up the full track record from the database using the entity ID
    // stored on the player track. entityId is set to [sourceId, itemId] when
    // the track is generated, which maps directly to the DB primary key.
    const { data: albumTrack } = useTrack(track?.entityId ?? [undefined, undefined]);

    // Attempt to retrieve the currently active track on mount
    useEffect(() => {
        async function getTrack() {
            const queue = await TrackPlayer.getQueue();
            const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
            if (currentTrackIndex !== undefined) {
                setTrack(queue[currentTrackIndex]);
                setIndex(currentTrackIndex);
            } else {
                setTrack(undefined);
                setIndex(undefined);
            }
        }

        getTrack();
    }, []);

    // Listen for update events
    useTrackPlayerEvents([ Event.PlaybackActiveTrackChanged, Event.PlaybackState ], (e) => {
        // GUARD: Listen for active track changed events
        if (e.type === Event.PlaybackActiveTrackChanged) {
            setIndex(e.index);
            setTrack(e.track);
        }
    });

    return { track, index, albumTrack };
}