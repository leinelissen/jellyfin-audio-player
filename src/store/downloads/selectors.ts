import { createSelector, EntityId } from '@reduxjs/toolkit';
import { intersection } from 'lodash';
import { AppState } from '@/store';

export const selectAllDownloads = (state: AppState) => state.downloads;
export const selectDownloadedEntities = (state: AppState) => state.downloads.entities;

/**
 * Only retain the supplied trackIds that have successfully been downloaded
 */
export const selectDownloadedTracks = (trackIds: EntityId[]) => (
    createSelector(
        selectAllDownloads,
        ({ entities, ids }) => {
            return intersection(trackIds, ids)
                .filter((id) => entities[id]?.isComplete);
        }
    )
);

/**
 * Select a boolean that indicates whether the track is downloaded
 */
export const selectIsDownloaded = (trackId: string) => (
    createSelector(
        selectDownloadedEntities,
        (entities) => entities[trackId]?.isComplete,
    )
);