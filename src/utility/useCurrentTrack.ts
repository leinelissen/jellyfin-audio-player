import { useEffect, useState } from 'react';
import TrackPlayer, { usePlaybackState, Track } from 'react-native-track-player';

/**
 * This hook retrieves the current playing track from TrackPlayer
 */
export default function useCurrentTrack(): Track | undefined {
    const state = usePlaybackState();
    const [track, setTrack] = useState<Track>();

    useEffect(() => {
        const fetchTrack = async () => {
            const currentTrackId = await TrackPlayer.getCurrentTrack();
        
            // GUARD: Only fetch current track if there is a current track
            if (!currentTrackId) {
                setTrack(undefined);
            }

            // GUARD: Only retrieve new track if it is different from the one we
            // have currently in state.
            if (currentTrackId === track?.id){
                return;
            }

            // If it is different, retrieve the track and save it
            try {
                const currentTrack = await TrackPlayer.getTrack(currentTrackId);
                setTrack(currentTrack);
            } catch {
                // Due to the async nature, a track might be removed at the
                // point when we try to retrieve it. If this happens, we'll just
                // smother the error and wait for a new track update to
                // finish.
            }
        };

        fetchTrack();
    }, [state, track, setTrack]);

    return track;
}