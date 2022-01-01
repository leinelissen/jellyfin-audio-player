import React, { useCallback, useEffect } from 'react';
import { MusicStackParams } from '../types';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useTypedSelector } from 'store';
import TrackListView from './components/TrackListView';
import { fetchTracksByAlbum } from 'store/music/actions';
import { differenceInDays } from 'date-fns';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from 'CONSTANTS';
import { t } from '@localisation';

type Route = RouteProp<MusicStackParams, 'Album'>;

const Album: React.FC = () => {
    const { params: { id } } = useRoute<Route>();
    const dispatch = useAppDispatch();

    // Retrieve the album data from the store
    const album = useTypedSelector((state) => state.music.albums.entities[id]);
    const albumTracks = useTypedSelector((state) => state.music.tracks.byAlbum[id]);

    // Define a function for refreshing this entity
    const refresh = useCallback(() => dispatch(fetchTracksByAlbum(id)), [id, dispatch]);

    // Auto-fetch the track data periodically
    useEffect(() => {
        if (!album?.lastRefreshed || differenceInDays(album?.lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            refresh();
        }
    }, [album?.lastRefreshed, refresh]);

    return (
        <TrackListView
            trackIds={albumTracks || []}
            title={album?.Name}
            artist={album?.AlbumArtist}
            entityId={id}
            refresh={refresh}
            playButtonText={t('play-album')}
            shuffleButtonText={t('shuffle-album')}
        />
    );
};

export default Album;