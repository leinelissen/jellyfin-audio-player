import { useTypedSelector } from 'store';
import { useCallback } from 'react';
import TrackPlayer, { Track } from 'react-native-track-player';
import { generateTrack } from './JellyfinApi';

/**
 * Generate a callback function that starts playing a full album given its
 * supplied id.
 */
export default function usePlayAlbum() {
    const credentials = useTypedSelector(state => state.settings.jellyfin);
    const albums = useTypedSelector(state => state.music.albums.entities);
    const tracks = useTypedSelector(state => state.music.tracks.entities);

    return useCallback(async function playAlbum(albumId: string, play: boolean = true): Promise<Track[] | undefined> {
        const album = albums[albumId];
        const backendTrackIds = album?.Tracks;

        // GUARD: Check if the album has songs
        if (!backendTrackIds?.length) {
            return;
        }

        // Convert all backendTrackIds to the relevant format for react-native-track-player
        const newTracks = backendTrackIds.map((trackId) => {
            const track = tracks[trackId];
            if (!trackId || !track) {
                return;
            }

            return generateTrack(track, credentials);
        }).filter((t): t is Track => typeof t !== 'undefined');

        // Clear the queue and add all tracks
        await TrackPlayer.reset();
        await TrackPlayer.add(newTracks);

        // Play the queue
        if (play) {
            await TrackPlayer.play();
        }

        return newTracks;
    }, [credentials, albums, tracks]);
}