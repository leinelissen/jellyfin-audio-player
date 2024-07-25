import TrackPlayer, { RepeatMode, State, Track } from 'react-native-track-player';
import { fetchApi } from './lib';

/**
 * This maps the react-native-track-player RepeatMode to a RepeatMode that is
 * expected by Jellyfin when reporting playback events.
 */
const RepeatModeMap: Record<RepeatMode, string> = {
    [RepeatMode.Off]: 'RepeatNone',
    [RepeatMode.Track]: 'RepeatOne',
    [RepeatMode.Queue]: 'RepeatAll',
};

/**
 * This will generate the payload that is required for playback events and send
 * it to the supplied path.
 */
export async function sendPlaybackEvent(
    path: string,
    track?: Track,
    lastPosition?: number,
) {
    // Extract all data from react-native-track-player
    const [
        activeTrack, { position: currentPosition }, repeatMode, volume, { state },
    ] = await Promise.all([
        track || TrackPlayer.getActiveTrack(),
        TrackPlayer.getProgress(),
        TrackPlayer.getRepeatMode(),
        TrackPlayer.getVolume(),
        TrackPlayer.getPlaybackState(),
    ]);

    // GUARD: Ensure that no empty events are sent out
    if (!activeTrack?.backendId) return;

    // Generate a payload from the gathered data
    const payload = {
        VolumeLevel: volume * 100,
        IsMuted: false,
        IsPaused: state === State.Paused,
        RepeatMode: RepeatModeMap[repeatMode],
        ShuffleMode: 'Sorted',
        PositionTicks: Math.round((lastPosition || currentPosition) * 10_000_000),
        PlaybackRate: 1,
        PlayMethod: 'transcode',
        MediaSourceId: activeTrack.backendId,
        ItemId: activeTrack.backendId,
        CanSeek: true,
        PlaybackStartTimeTicks: null,
    };

    // Generate a config from the credentials and dispatch the request
    await fetchApi(path, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
    // Swallow and errors from the request
    }, false).catch((err) => {
        console.error(err);
    });
}