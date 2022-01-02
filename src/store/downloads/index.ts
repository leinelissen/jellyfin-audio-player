import { createSlice, Dictionary, EntityId } from '@reduxjs/toolkit';
import { completeDownload, downloadAdapter, failDownload, initializeDownload, progressDownload, removeDownloadedTrack } from './actions';
import { DownloadEntity } from './types';

interface State {
    entities: Dictionary<DownloadEntity>;
    ids: EntityId[];
}

const initialState: State = {
    entities: {},
    ids: [],
};

const downloads = createSlice({
    name: 'downloads',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(initializeDownload, (state, action) => {
            downloadAdapter.upsertOne(state, {
                ...action.payload,
                progress: 0,
                isFailed: false,
                isComplete: false,
            });
        });
        builder.addCase(progressDownload, (state, action) => {
            downloadAdapter.updateOne(state, {
                id: action.payload.id,
                changes: action.payload
            });
        });
        builder.addCase(completeDownload, (state, action) => {
            downloadAdapter.updateOne(state, {
                id: action.payload.id,
                changes: {
                    ...action.payload,
                    isFailed: false,
                    isComplete: true,
                }
            });
        });
        builder.addCase(failDownload, (state, action) => {
            downloadAdapter.updateOne(state, {
                id: action.payload.id,
                changes: {
                    isComplete: false,
                    isFailed: true,
                    progress: 0,
                }
            });
        });
        builder.addCase(removeDownloadedTrack.fulfilled, (state, action) => {
            downloadAdapter.removeOne(state, action.meta.arg);
        });
    },
});

export default downloads;