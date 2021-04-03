import { useCallback, useEffect } from 'react';
import TrackPlayer, { TrackPlayerEvents } from 'react-native-track-player';
import { shallowEqual, useDispatch } from 'react-redux';
import { useTypedSelector } from 'store';
import player from 'store/player';

function PlayerStateUpdater() {
    const dispatch = useDispatch();
    const trackId = useTypedSelector(state => state.player.currentTrack?.id, shallowEqual);

    const handleUpdate = useCallback(async () => {
        const currentTrackId = await TrackPlayer.getCurrentTrack();

        // GUARD: Only retrieve new track if it is different from the one we
        // have currently in state.
        if (currentTrackId === trackId){
            return;
        }
                
        // GUARD: Only fetch current track if there is a current track
        if (!currentTrackId) {
            dispatch(player.actions.setCurrentTrack(undefined));
        }

        // If it is different, retrieve the track and save it
        try {
            const currentTrack = await TrackPlayer.getTrack(currentTrackId);
            dispatch(player.actions.setCurrentTrack(currentTrack));
        } catch {
            // Due to the async nature, a track might be removed at the
            // point when we try to retrieve it. If this happens, we'll just
            // smother the error and wait for a new track update to
            // finish.
        }
    }, [trackId, dispatch]);

    useEffect(() => {
        function handler() {
            handleUpdate();
        }

        handler();

        const subscription = TrackPlayer.addEventListener(TrackPlayerEvents.PLAYBACK_TRACK_CHANGED, handler);
        
        return () => {
            subscription.remove();
        };
    }, []);

    return null;
}

export default PlayerStateUpdater;