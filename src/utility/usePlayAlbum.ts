import { useTypedSelector } from 'store';
import { useCallback } from 'react';
import TrackPlayer, { Track } from 'react-native-track-player';
import { generateTrack } from './JellyfinApi';
import useQueue from './useQueue';
import player from 'store/player';
import { useDispatch } from 'react-redux';

/**
 * Generate a callback function that starts playing a full album given its
 * supplied id.
 */
export default function usePlayAlbum() {
    const dispatch = useDispatch();
    const credentials = useTypedSelector(state => state.settings.jellyfin);
    const albums = useTypedSelector(state => state.music.albums.entities);
    const tracks = useTypedSelector(state => state.music.tracks.entities);
    const queue = useQueue();

    return useCallback(async function playAlbum(albumId: string, play = true): Promise<TrackPlayer.Track[] | undefined> {
        const album = albums[albumId];
        const trackIds = album?.Tracks;

        // GUARD: Check that the album actually has tracks
        if (!album || !trackIds?.length) {
            return;
        }

        // Check if the queue already contains the consecutive track listing
        // that is described as part of the album
        const queuedAlbum = queue.reduce<TrackPlayer.Track[]>((sum, track) => {
            if (track.id.startsWith(trackIds[sum.length])) {
                sum.push(track);
            } else {
                sum = [];
            }

            return sum;
        }, []);

        // If the entire album is already in the queue, we can just return those
        // tracks, rather than adding it to the queue again.
        if (queuedAlbum.length === trackIds.length) {
            if (play) {
                await TrackPlayer.skip(trackIds[0]);
                await TrackPlayer.play();
            }
            
            return queuedAlbum;
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
        
        // Then, we'll dispatch the added track event
        dispatch(player.actions.addNewTrackToPlayer());

        if (play) {
            await TrackPlayer.skip(trackIds[0]);
            await TrackPlayer.play();
        }

        return newTracks;
    }, [credentials, albums, tracks, queue, dispatch]);
}