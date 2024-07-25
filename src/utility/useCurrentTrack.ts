import { useTypedSelector } from '@/store';
import { AlbumTrack } from '@/store/music/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

    // Retrieve entities from the store
    const entities = useTypedSelector((state) => state.music.tracks.entities);

    // Attempt to extract the track from the store
    const albumTrack = useMemo(() => (
        entities[track?.backendId]
    ), [track?.backendId, entities]);

    // Retrieve the current track from the queue using the index
    const retrieveCurrentTrack = useCallback(async () => {
        const queue = await TrackPlayer.getQueue();
        const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
        if (currentTrackIndex !== undefined) {
            setTrack(queue[currentTrackIndex]);
            setIndex(currentTrackIndex);
        } else {
            setTrack(undefined);
            setIndex(undefined);
        }
    }, [setTrack, setIndex]);

    // Then execute the function on component mount and track changes
    useEffect(() => { retrieveCurrentTrack(); }, [retrieveCurrentTrack]);
    useTrackPlayerEvents([ Event.PlaybackActiveTrackChanged, Event.PlaybackState ], retrieveCurrentTrack);

    return { track, index, albumTrack };
}
