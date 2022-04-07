import React, { useCallback, useEffect } from 'react';
import { useAppDispatch, useTypedSelector } from '@/store';
import SinglesListView from './components/SinglesListView';
import { t } from '@/localisation';
import { fetchAllTracks } from '@/store/music/actions';

const Singles: React.FC = () => {
    const dispatch = useAppDispatch();

    // Retrieve all tracks data from the store
    const allTracks = useTypedSelector((state) => state.music.tracks.ids);

    // Define a function for refreshing this entity
    const retrieveData = useCallback(() => dispatch(fetchAllTracks()), [dispatch]);

    return (
        <SinglesListView
            trackIds={allTracks || []}
            refresh={retrieveData}
            playButtonText={t('play-all-tracks')}
            shuffleButtonText={t('shuffle-all-tracks')}
            downloadButtonText={t('download-all-tracks')}
        />
    );
};

export default Singles;