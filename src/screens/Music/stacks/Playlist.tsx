import React, { useCallback, useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { usePlaylists, useTracksByPlaylist } from '@/store/music/hooks';
import * as musicFetchers from '@/store/music/fetchers';
import { useSourceId } from '@/store/db/useSourceId';
import TrackListView from './components/TrackListView';
import { differenceInDays } from 'date-fns';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import { t } from '@/localisation';
import { StackParams } from '@/screens/types';

type Route = RouteProp<StackParams, 'Playlist'>;

const Playlist: React.FC = () => {
    const { params: { id } } = useRoute<Route>();

    // Retrieve the playlist data from the store
    const sourceId = useSourceId();
    const { playlists } = usePlaylists(sourceId);
    const playlist = playlists[id];
    const { ids: playlistTrackIds } = useTracksByPlaylist(sourceId, id);

    // Define a function for refreshing this entity
    const refresh = useCallback(
        () => musicFetchers.fetchAndStoreTracksByPlaylist(id),
        [id]
    );

    // Auto-fetch the track data periodically
    useEffect(() => {
        if (!playlist?.lastRefreshed || differenceInDays(playlist?.lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            refresh();
        }
    }, [playlist?.lastRefreshed, refresh]);

    return (
        <TrackListView
            trackIds={playlistTrackIds || []}
            title={playlist?.Name}
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
