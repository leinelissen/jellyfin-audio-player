import { useTracks } from '@/store/music/hooks';
import { useSourceId } from '@/store/db/useSourceId';
import { AlbumTrack } from '@/store/music/types';
import { useEffect, useMemo, useState } from 'react';
import TrackPlayer, { Event, useTrackPlayerEvents, Track } from 'react-native-track-player';

interface CurrentTrackResponse {
    track: Track | undefined;
    albumTrack: AlbumTrack | undefined;
    index: number | undefined;
}

/**
 * This hook retrieves the current playing track from TrackPlayer
 */
export default function useCurrentTrack(): CurrentTrackResponse {
    const [track, setTrack] = useState<Track | undefined>();
    const [index, setIndex] = useState<number | undefined>();

    // Retrieve entities from the database
    const sourceId = useSourceId();
    const { tracks: entities } = useTracks(sourceId);

    // Attempt to extract the track from the store
    const albumTrack = useMemo(() => (
        entities[track?.backendId]
    ), [track?.backendId, entities]);

    // Then execute the function on component mount and track changes
    useEffect(() => { 
        // Async function that retrieves the current track whenever the hook is
        // first executed
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
