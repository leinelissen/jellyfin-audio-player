import { createAction, createAsyncThunk, createEntityAdapter, EntityId } from '@reduxjs/toolkit';
import { AppState } from 'store';
import { generateTrackUrl } from 'utility/JellyfinApi';
import { downloadFile, unlink, DocumentDirectoryPath } from 'react-native-fs';
import { DownloadEntity } from './types';

export const downloadAdapter = createEntityAdapter<DownloadEntity>({
    selectId: (entity) => entity.id,
});

export const initializeDownload = createAction<{ id: EntityId, size?: number, jobId?: number }>('download/initialize');
export const progressDownload = createAction<{ id: EntityId, progress: number, jobId?: number }>('download/progress');
export const completeDownload = createAction<{ id: EntityId, location: string, size?: number }>('download/complete');
export const failDownload = createAction<{ id: EntityId }>('download/fail');

export const downloadTrack = createAsyncThunk(
    '/downloads/track',
    async (id: EntityId, { dispatch, getState }) => {
        // Get the credentials from the store
        const { settings: { jellyfin: credentials } } = (getState() as AppState);

        // Generate the URL we can use to download the file
        const url = generateTrackUrl(id as string, credentials);
        const location = `${DocumentDirectoryPath}/${id}.mp3`;

        // Actually kick off the download
        const { promise } = await downloadFile({
            fromUrl: url,
            progressInterval: 50,
            background: true,
            begin: ({ jobId, contentLength }) => {
                // Dispatch the initialization
                dispatch(initializeDownload({ id, jobId, size: contentLength }));
            },
            progress: (result) => {
                // Dispatch a progress update
                dispatch(progressDownload({ id, progress: result.bytesWritten / result.contentLength }));
            },
            toFile: location,
        });

        // Await job completion
        const result = await promise;
        dispatch(completeDownload({ id, location, size: result.bytesWritten }));
    },
);

export const removeDownloadedTrack = createAsyncThunk(
    '/downloads/track/remove',
    async(id: EntityId) => {
        return unlink(`${DocumentDirectoryPath}/${id}.mp3`);
    }
);

