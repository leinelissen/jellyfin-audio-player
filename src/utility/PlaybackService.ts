/**
* This is the code that will run tied to the player.
*
* The code here might keep running in the background.
*
* You should put everything here that should be tied to the playback but not the UI
* such as processing media buttons or analytics
*/

import TrackPlayer, { Event, State } from 'react-native-track-player';
import store, { useTypedSelector } from '@/store';
import { sendPlaybackEvent } from './JellyfinApi';
import { useDispatch } from 'react-redux';
import { setSleepTime } from '@/store/settings/actions';
import internal from 'stream';

export default async function() {
    let interval = setInterval(() => {}, 0);

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

    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (e) => {
        // Retrieve the current settings from the Redux store
        const settings = store.getState().settings;

        // GUARD: Only report playback when the settings is enabled
        if (settings.enablePlaybackReporting && 'track' in e) {
            // GUARD: End the previous track if it's about to end
            if ('nextTrack' in e && typeof e.track === 'number') {
                sendPlaybackEvent('/Sessions/Playing/Stopped', settings.jellyfin, e.track);
            }

            sendPlaybackEvent('/Sessions/Playing', settings.jellyfin);
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, () => {
        // Retrieve the current settings from the Redux store
        const settings = store.getState().settings;

        // GUARD: Only report playback when the settings is enabled
        if (settings.enablePlaybackReporting) {
            sendPlaybackEvent('/Sessions/Playing/Progress', settings.jellyfin);
        }

        // regularly check if sleeper is enabled, then disable the timer
        if (!settings.enabledSleeper) {
            clearInterval(interval);
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
        // GUARD: Only respond to stopped events
        if (event.state === State.Stopped) {
            // Retrieve the current settings from the Redux store
            const settings = store.getState().settings;

            // GUARD: Only report playback when the settings is enabled
            if (settings.enablePlaybackReporting) {
                sendPlaybackEvent('/Sessions/Playing/Stopped', settings.jellyfin);
            }
        }

        // Handle is playback state is playing
        if (event.state === State.Playing) {
            const settings = store.getState().settings;
            
            // Start timer is sleeper is enabled
            if (settings.enabledSleeper) {
                let time = settings.sleepTime;
                interval = setInterval(() => {
                    if (time > 0) {
                        time -= 1;
                    } else {
                        TrackPlayer.pause();
                        clearInterval(interval);
                    }
                }, 1000);
            }
        }
    });
    
}