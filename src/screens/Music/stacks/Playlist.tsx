import React, { useMemo } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { usePlaylist } from '@/store/playlists/hooks';
import { useTracksByPlaylist } from '@/store/tracks/hooks';
import Sync from '@/store/sources/sync-manager';
import useSyncAction from '@/utility/useSyncAction';
import TrackListView from './components/TrackListView';
import { t } from '@/localisation';
import { StackParams } from '@/screens/types';
import type { EntityId } from '@/store/types';

type Route = RouteProp<StackParams, 'Playlist'>;

const Playlist: React.FC = () => {
    const { params: { id } } = useRoute<Route>();

    const entityId = useMemo<EntityId>(() => id, [id]);

    const { data: playlist } = usePlaylist(entityId);
    const { data: tracks } = useTracksByPlaylist(entityId);

    const [isLoading, refresh] = useSyncAction(() => Sync.syncPlaylistTracks(entityId));

    return (
        <TrackListView
            tracks={tracks ?? []}
            title={playlist?.name ?? ''}
            entityId={entityId}
            refresh={refresh}
            isLoading={isLoading}
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