/**
* This is the code that will run tied to the player.
*
* The code here might keep running in the background.
*
* You should put everything here that should be tied to the playback but not the UI
* such as processing media buttons or analytics
*/

import TrackPlayer, { Event, State } from 'react-native-track-player';
import store from '@/store';
import { setTimerDate } from '@/store/sleep-timer';
import { sendPlaybackEvent } from './JellyfinApi/playback';

export default async function() {
    TrackPlayer.addEventListener(Event.RemotePlay, () => {
        TrackPlayer.play();
    });
    
    TrackPlayer.addEventListener(Event.RemotePause, () => {
        TrackPlayer.pause();
    });
    
    TrackPlayer.addEventListener(Event.RemoteNext, () => {
        TrackPlayer.skipToNext();
    });
    
    TrackPlayer.addEventListener(Event.RemotePrevious, () => {
        TrackPlayer.skipToPrevious();
    });
    
    TrackPlayer.addEventListener(Event.RemoteStop, () => {
        TrackPlayer.reset();
    });

    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
        TrackPlayer.seekTo(event.position);
    });

    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (e) => {
        // Retrieve the current settings from the Redux store
        const settings = store.getState().settings;
        console.log('TrackChanged', e?.track?.title);

        // GUARD: Only report playback when the settings is enabled
        if (settings.enablePlaybackReporting && 'track' in e) {
            // GUARD: End the previous track if it's about to end
            if (e.lastTrack) {
                sendPlaybackEvent('/Sessions/Playing/Stopped', e.lastTrack, e.lastPosition);
            }

            sendPlaybackEvent('/Sessions/Playing', e.track);
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, () => {
        // Retrieve the current settings from the Redux store
        const { settings, sleepTimer } = store.getState();

        // GUARD: Only report playback when the settings is enabled
        if (settings.enablePlaybackReporting) {
            sendPlaybackEvent('/Sessions/Playing/Progress');
        }

        // check if timerDate is undefined, otherwise start timer
        if (sleepTimer.date && sleepTimer.date < new Date().valueOf()) {
            TrackPlayer.pause();
            store.dispatch(setTimerDate(null));
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
        // Retrieve the current settings from the Redux store
        const settings = store.getState().settings;

        // GUARD: Only report playback when the settings is enabled
        if (settings.enablePlaybackReporting) {
            // GUARD: Only respond to stopped events
            if (event.state === State.Stopped) {
                sendPlaybackEvent('/Sessions/Playing/Stopped');
            } else if (event.state === State.Paused) {
                sendPlaybackEvent('/Sessions/Playing/Progress');
            }
        }
    });
    
}