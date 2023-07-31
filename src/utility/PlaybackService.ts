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
import { sendPlaybackEvent } from './JellyfinApi';
import { setRemainingSleepTime } from '@/store/settings/actions';

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

        // check if datetime is undefined, otherwise start timer
        if (settings.dateTime === undefined) {
            store.dispatch(setRemainingSleepTime(''));
        } else {
            const millisecondsDiff = settings.dateTime.valueOf() - new Date().valueOf();

            const timeDiff = new Date(millisecondsDiff);
            let interval = setInterval(() => {});

            if (timeDiff.getTime() > 0) {
                interval = setInterval(() => {
                    const settings = store.getState().settings;

                    if (settings.dateTime !== undefined) {
                        const millisecondsDiff = settings.dateTime.valueOf() - new Date().valueOf();

                        const timeDiff = new Date(millisecondsDiff);
            
                        if (timeDiff.getTime() > 0) {
                            let sec = Math.floor(timeDiff.getTime() / 1000);
                            let min = Math.floor(sec/60);
                            sec = sec%60;
                            const hours = Math.floor(min/60);
                            min = min%60;
            
                            const timer = `${hours.toString().length === 1 ? '0' + hours : hours}:${min.toString().length === 1 ? '0' + min : min}:${sec.toString().length === 1 ? '0' + sec : sec}`;
            
                            store.dispatch(setRemainingSleepTime(timer));
                        } else {
                            store.dispatch(setRemainingSleepTime(''));
                            TrackPlayer.pause();
                            clearInterval(interval);
                        }
                    } else {
                        clearInterval(interval);
                    }
                }, 1000);
            }
        }
    });

    TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
        // Retrieve the current settings from the Redux store
        const settings = store.getState().settings;

        // GUARD: Only respond to stopped events
        if (event.state === State.Stopped) {

            // GUARD: Only report playback when the settings is enabled
            if (settings.enablePlaybackReporting) {
                sendPlaybackEvent('/Sessions/Playing/Stopped', settings.jellyfin);
            }
        }
    });
    
}