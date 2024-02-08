import { createSlice } from '@reduxjs/toolkit';
import {
    completeDownload,
    downloadAdapter,
    downloadTrack,
    failDownload,
    initializeDownload,
    progressDownload,
    queueTrackForDownload,
    removeDownloadedTrack
} from './actions';
import { DownloadEntity } from './types';

interface State {
    entities: Record<string, DownloadEntity>;
    ids: string[];
    queued: string[];
}

export const initialState: State = {
    entities: {},
    ids: [],
    queued: [],
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
            // Update the item to be completed
            downloadAdapter.updateOne(state, {
                id: action.payload.id,
                changes: {
                    ...action.payload,
                    isFailed: false,
                    isComplete: true,
                    error: undefined,
                }
            });

            // Remove the item from the queue
            const newSet = new Set(state.queued);
            newSet.delete(action.payload.id);
            state.queued = Array.from(newSet);
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
        builder.addCase(downloadTrack.rejected, (state, action) => {
            downloadAdapter.upsertOne(state, {
                id: action.meta.arg,
                isComplete: false,
                isFailed: true,
                progress: 0,
                error: action.error.message,
            });

            // Remove the item from the queue
            const newSet = new Set(state.queued);
            newSet.delete(action.meta.arg);
            state.queued = Array.from(newSet);
        });
        builder.addCase(removeDownloadedTrack.fulfilled, (state, action) => {
            // Remove the download if it exists
            downloadAdapter.removeOne(state, action.meta.arg);

            // Remove the item from the queue if it is in there
            const newSet = new Set(state.queued);
            newSet.delete(action.meta.arg);
            state.queued = Array.from(newSet);
        });
        builder.addCase(queueTrackForDownload, (state, action) => {
            const newSet = new Set(state.queued).add(action.payload);
            state.queued = Array.from(newSet);
        });
    },
});

export default downloads;