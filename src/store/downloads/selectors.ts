import { createSelector, EntityId } from '@reduxjs/toolkit';
import { intersection } from 'lodash';
import { AppState } from 'store';

export const selectDownloadedTracks = (trackIds: EntityId[]) => (
    createSelector(
        (state: AppState) => state.downloads,
        ({ entities, ids }) => {
            return intersection(trackIds, ids)
                .filter((id) => entities[id]?.isComplete);
        }
    )
);
