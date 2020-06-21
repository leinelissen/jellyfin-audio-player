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

    return useCallback(async function playAlbum(albumId: string) {
        const album = albums[albumId];
        const trackIds = album?.Tracks;

        // GUARD: Check that the album actually has tracks
        if (!album || !trackIds?.length || !tracks.length) {
            return;
        }

        // Convert all trackIds to the relevant format for react-native-track-player
        const newTracks = trackIds.map((trackId) => {
            const track = tracks[trackId];
            if (!trackId || !track) {
                return;
            }

            return generateTrack(track, credentials);
        }).filter((t): t is Track => typeof t !== 'undefined');

        // Clear the queue and add all tracks
        await TrackPlayer.removeUpcomingTracks();
        await TrackPlayer.add(newTracks);
        await TrackPlayer.skip(trackIds[0]);
        TrackPlayer.play();
    }, [credentials, albums, tracks]);
}