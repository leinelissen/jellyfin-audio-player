import { Track } from 'react-native-track-player';
import { useTypedSelector } from 'store';

const idEqual = (left: Track | undefined, right: Track | undefined) => {
    return left?.id === right?.id;
};

/**
 * This hook retrieves the current playing track from TrackPlayer
 */
export default function useCurrentTrack(): Track | undefined {
    const track = useTypedSelector(state => state.player.currentTrack, idEqual);
    
    return track;
}