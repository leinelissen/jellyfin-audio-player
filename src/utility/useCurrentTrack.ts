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
                return;
            }

            const currentTrack = await TrackPlayer.getTrack(currentTrackId);
            setTrack(currentTrack);
        };

        fetchTrack();
    }, [state]);

    return track;
}