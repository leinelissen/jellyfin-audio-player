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
            const currentTrack = await TrackPlayer.getTrack(currentTrackId);
            setTrack(currentTrack);
        };

        fetchTrack();
    }, [state, track, setTrack]);

    return track;
}