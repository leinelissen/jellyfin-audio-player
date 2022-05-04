import React, { useCallback, useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTypedSelector } from 'store';
import SinglesListView from './components/SinglesListView';
import { fetchAllTracks } from 'store/music/actions';
import { differenceInDays } from 'date-fns';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from 'CONSTANTS';
import { t } from '@localisation';
import { useDispatch } from 'react-redux';

const Singles: React.FC = () => {
    const dispatch = useDispatch();

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