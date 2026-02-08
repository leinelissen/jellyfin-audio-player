/**
 * Download queue manager
 * Manages queueing and executing track downloads
 */

import { DocumentDirectoryPath, downloadFile, unlink, exists } from 'react-native-fs';
import { getActiveSource } from '@/store/settings/db';
import { db } from '@/store/db';
import { tracks } from '@/store/tracks/tracks';
import { downloads } from './downloads';
import { eq } from 'drizzle-orm';
import { generateTrackUrl } from '@/utility/JellyfinApi/track';
import { getImage } from '@/utility/JellyfinApi/lib';
import { getExtensionForUrl } from '@/utility/mimeType';
import { 
    initializeDownload, 
    updateDownloadProgress, 
    completeDownload, 
    failDownload,
    removeDownload as dbRemoveDownload
} from './actions';

export async function queueTrackForDownload(trackId: string): Promise<void> {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');
    
    await initializeDownload(source.id, trackId);
}

export async function downloadTrack(trackId: string): Promise<void> {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');
    
    try {
        const trackData = await db
            .select()
            .from(tracks)
            .where(eq(tracks.id, trackId))
            .limit(1);
        
        const track = trackData[0];
        if (!track) {
            await failDownload(trackId);
            return;
        }
        
        // Parse metadata if needed for image URL
        let metadata: any = {};
        try {
            metadata = track.metadataJson ? JSON.parse(track.metadataJson as string) : {};
        } catch (error) {
            console.warn('Failed to parse track metadata:', error);
        }
        
        const trackWithMetadata = { ...track, ...metadata };
        
        const audioUrl = generateTrackUrl(trackId);
        const imageUrl = getImage(trackWithMetadata);
        
        const [audioExt, imageExt] = await Promise.all([
            getExtensionForUrl(audioUrl),
            imageUrl ? getExtensionForUrl(imageUrl).catch(() => null) : null
        ]);
        
        const audioLocation = `${DocumentDirectoryPath}/${trackId}.${audioExt}`;
        const imageLocation = imageExt ? `${DocumentDirectoryPath}/${trackId}.${imageExt}` : undefined;
        
        const { promise: audioPromise } = downloadFile({
            fromUrl: audioUrl,
            progressInterval: 1000,
            background: true,
            begin: () => {
                updateDownloadProgress(trackId, 0);
            },
            progress: (result) => {
                updateDownloadProgress(trackId, result.bytesWritten / result.contentLength);
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
        
        await Promise.all([audioPromise, imagePromise]);
        await completeDownload(trackId, audioLocation);
    } catch (error) {
        await failDownload(trackId);
    }
}

export async function removeDownloadedTrack(trackId: string): Promise<void> {
    const downloadData = await db
        .select()
        .from(downloads)
        .where(eq(downloads.id, trackId))
        .limit(1);
    
    const download = downloadData[0];
    
    if (download?.filename && await exists(download.filename)) {
        await unlink(download.filename);
    }
    
    await dbRemoveDownload(trackId);
}
