import React, { useCallback, useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useTypedSelector } from 'store';
import TrackListView from './components/TrackListView';
import { fetchTracksByPlaylist } from 'store/music/actions';
import { differenceInDays } from 'date-fns';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from 'CONSTANTS';
import { t } from '@localisation';
import { StackParams } from 'screens/types';

type Route = RouteProp<StackParams, 'Album'>;

const Playlist: React.FC = () => {
    const { params: { id } } = useRoute<Route>();
    const dispatch = useAppDispatch();

    // Retrieve the album data from the store
    const playlist = useTypedSelector((state) => state.music.playlists.entities[id]);
    const playlistTracks = useTypedSelector((state) => state.music.tracks.byPlaylist[id]);

    // Define a function for refreshing this entity
    const refresh = useCallback(() => dispatch(fetchTracksByPlaylist(id)), [dispatch, id]);

    // Auto-fetch the track data periodically
    useEffect(() => {
        if (!playlist?.lastRefreshed || differenceInDays(playlist?.lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            refresh();
        }
    }, [playlist?.lastRefreshed, refresh]);

    return (
        <TrackListView
            trackIds={playlistTracks || []}
            title={playlist?.Name}
            entityId={id}
            refresh={refresh}
            listNumberingStyle='index'
            playButtonText={t('play-playlist')}
            shuffleButtonText={t('shuffle-playlist')}
            downloadButtonText={t('download-playlist')} 
            deleteButtonText={t('delete-playlist')}
        />
    );
};

export default Playlist;