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
    track?: Track
) {
    // Extract all data from react-native-track-player
    const [
        activeTrack, { position }, repeatMode, volume, { state },
    ] = await Promise.all([
        track || TrackPlayer.getActiveTrack(),
        TrackPlayer.getProgress(),
        TrackPlayer.getRepeatMode(),
        TrackPlayer.getVolume(),
        TrackPlayer.getPlaybackState(),
    ]);

    // Generate a payload from the gathered data
    const payload = {
        VolumeLevel: volume * 100,
        IsMuted: false,
        IsPaused: state === State.Paused,
        RepeatMode: RepeatModeMap[repeatMode],
        ShuffleMode: 'Sorted',
        PositionTicks: Math.round(position * 10_000_000),
        PlaybackRate: 1,
        PlayMethod: 'transcode',
        MediaSourceId: activeTrack?.backendId || null,
        ItemId: activeTrack?.backendId || null,
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
    }).catch((err) => {
        console.error(err);
    });
}