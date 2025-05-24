import React, { useCallback, useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useTypedSelector } from '@/store';
import TrackListView from './components/TrackListView';
import { fetchInstantMixByTrackId, fetchTracksByPlaylist } from '@/store/music/actions';
import { differenceInDays } from 'date-fns';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import { t } from '@/localisation';
import { StackParams } from '@/screens/types';

type Route = RouteProp<StackParams, 'Playlist'>;

const Playlist: React.FC = () => {
    const { params: { id, isMix } } = useRoute<Route>();
    const dispatch = useAppDispatch();

    // Retrieve the album data from the store
    const playlist = useTypedSelector((state) => state.music.playlists.entities[id]);
    const playlistTracks = useTypedSelector((state) => state.music.tracks.byPlaylist[id]);
    const mixTrack = useTypedSelector(state => state.music.tracks.entities[id]);

    // Define a function for refreshing this entity
    const refresh = useCallback(
        () => dispatch(isMix ? fetchInstantMixByTrackId(id) : fetchTracksByPlaylist(id)),
        [dispatch, id, isMix]
    );

    // Auto-fetch the track data periodically
    useEffect(() => {
        if (!playlist?.lastRefreshed || differenceInDays(playlist?.lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            refresh();
        }
    }, [playlist?.lastRefreshed, refresh]);

    return (
        <TrackListView
            trackIds={playlistTracks || []}
            title={isMix ? `${t('mix')} - ${mixTrack?.Name}` : playlist?.Name}
            entityId={id}
            refresh={refresh}
            listNumberingStyle='index'
            playButtonText={t('play-playlist')}
            shuffleButtonText={t('shuffle-playlist')}
            downloadButtonText={t('download-playlist')} 
            deleteButtonText={t('delete-playlist')}
            itemDisplayStyle='playlist'
        />
    );
};

export default Playlist;
