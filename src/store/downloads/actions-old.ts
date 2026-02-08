import { createAction, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { AppState } from '@/store';
import { downloadFile, unlink, DocumentDirectoryPath, exists } from 'react-native-fs';
import { DownloadEntity } from './types';
import { generateTrackUrl } from '@/utility/JellyfinApi/track';

import { getImage } from '@/utility/JellyfinApi/lib';
import { getExtensionForUrl } from '@/utility/mimeType';

export const downloadAdapter = createEntityAdapter<DownloadEntity>();

export const queueTrackForDownload = createAction<string>('download/queue');
export const initializeDownload = createAction<{ id: string, size?: number, jobId?: number, location: string, image?: string }>('download/initialize');
export const progressDownload = createAction<{ id: string, progress: number, jobId?: number }>('download/progress');
export const completeDownload = createAction<{ id: string, location: string, size?: number, image?: string }>('download/complete');
export const failDownload = createAction<{ id: string }>('download/fail');

export const downloadTrack = createAsyncThunk(
    '/downloads/track',
    async (id: string, { dispatch, getState }) => {
        // Generate the URL we can use to download the file
        const entity = (getState() as AppState).music.tracks.entities[id];
        const audioUrl = generateTrackUrl(id);
        const imageUrl = getImage(entity);

        // Get the content-type from the URL by doing a HEAD-only request
        const [audioExt, imageExt] = await Promise.all([
            getExtensionForUrl(audioUrl),
            // Image files may be absent
            imageUrl ? getExtensionForUrl(imageUrl).catch(() => null) : null
        ]);

        // Then generate the proper location
        const audioLocation = `${DocumentDirectoryPath}/${id}.${audioExt}`;
        const imageLocation = imageExt ? `${DocumentDirectoryPath}/${id}.${imageExt}` : undefined;

        // Actually kick off the download 
        const { promise: audioPromise } = downloadFile({
            fromUrl: audioUrl,
            progressInterval: 1000,
            background: true,
            begin: ({ jobId, contentLength }) => {
                // Dispatch the initialization
                dispatch(initializeDownload({ id, jobId, size: contentLength, location: audioLocation, image: imageLocation }));
            },
            progress: (result) => {
                // Dispatch a progress update
                dispatch(progressDownload({ id, progress: result.bytesWritten / result.contentLength }));
            },
            toFile: audioLocation,
        });

        const { promise: imagePromise } = imageExt && imageLocation
            ? downloadFile({
                fromUrl: imageUrl!,
                toFile: imageLocation,
                background: true,
            })
            : { promise: Promise.resolve(null) };

        // Await job completion
        const [audioResult, imageResult] = await Promise.all([audioPromise, imagePromise]);
        const totalSize = audioResult.bytesWritten + (imageResult?.bytesWritten || 0);
        dispatch(completeDownload({ id, location: audioLocation, size: totalSize, image: imageLocation }));
    },
);

export const removeDownloadedTrack = createAsyncThunk(
    '/downloads/remove/track',
    async (id: string, { getState }) => {
        // Retrieve the state
        const { downloads: { entities } } = getState() as AppState;

        // Attempt to retrieve the entity from the state
        const download = entities[id];
        if (!download) {
            throw new Error('Attempted to remove unknown downloaded track.');
        }

        // Then unlink the file, if it exists
        if (download.location && await exists(download.location)) {
            return unlink(download.location);
        }
    }
);

