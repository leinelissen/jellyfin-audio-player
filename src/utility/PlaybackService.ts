/**
* This is the code that will run tied to the player.
*
* The code here might keep running in the background.
*
* You should put everything here that should be tied to the playback but not the UI
* such as processing media buttons or analytics
*/

import TrackPlayer, { Event } from 'react-native-track-player';

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
        TrackPlayer.destroy();
    });

    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
        TrackPlayer.seekTo(event.position);
    });
    
}