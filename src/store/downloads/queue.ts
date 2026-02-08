/**
 * Download queue manager
 * Manages queueing and executing track downloads
 */

import { DocumentDirectoryPath, downloadFile, unlink, exists } from 'react-native-fs';
import { getActiveSource } from '@/store/settings/db';
import { db } from '@/store/db';
import { tracks } from '@/store/db/schema/tracks';
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
} from './db';

/**
 * Queue a track for download
 */
export async function queueTrackForDownload(trackId: string): Promise<void> {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');
    
    // Initialize the download in the database
    await initializeDownload(source.id, trackId);
}

/**
 * Execute a track download
 * This is called by the DownloadManager component
 */
export async function downloadTrack(trackId: string): Promise<void> {
    const source = await getActiveSource();
    if (!source) throw new Error('No active source');
    
    try {
        // Get track from database
        const trackData = await db
            .select()
            .from(tracks)
            .where(eq(tracks.id, trackId))
            .limit(1);
        
        const dbTrack = trackData[0];
        if (!dbTrack) {
            await failDownload(trackId, 'Track not found in database');
            return;
        }
        
        // Enrich track to get full AlbumTrack object
        const metadata = dbTrack.metadataJson ? JSON.parse(dbTrack.metadataJson) : {};
        const track = {
            Id: dbTrack.id,
            Name: dbTrack.name,
            AlbumId: dbTrack.albumId,
            Album: dbTrack.album,
            AlbumArtist: dbTrack.albumArtist,
            ProductionYear: dbTrack.productionYear,
            IndexNumber: dbTrack.indexNumber,
            ParentIndexNumber: dbTrack.parentIndexNumber,
            HasLyrics: dbTrack.hasLyrics,
            RunTimeTicks: dbTrack.runTimeTicks,
            ...metadata,
        };
        
        // Generate URLs
        const audioUrl = generateTrackUrl(trackId);
        const imageUrl = getImage(track);
        
        // Get extensions
        const [audioExt, imageExt] = await Promise.all([
            getExtensionForUrl(audioUrl),
            imageUrl ? getExtensionForUrl(imageUrl).catch(() => null) : null
        ]);
        
        // Generate file locations
        const audioLocation = `${DocumentDirectoryPath}/${trackId}.${audioExt}`;
        const imageLocation = imageExt ? `${DocumentDirectoryPath}/${trackId}.${imageExt}` : undefined;
        
        // Download audio file
        const { promise: audioPromise } = downloadFile({
            fromUrl: audioUrl,
            progressInterval: 1000,
            background: true,
            begin: ({ contentLength }) => {
                updateDownloadProgress(trackId, 0, { size: contentLength });
            },
            progress: (result) => {
                const progressValue = result.bytesWritten / result.contentLength;
                updateDownloadProgress(trackId, progressValue);
            },
            toFile: audioLocation,
        });
        
        // Download image file if available
        const { promise: imagePromise } = imageExt && imageLocation
            ? downloadFile({
                fromUrl: imageUrl!,
                toFile: imageLocation,
                background: true,
            })
            : { promise: Promise.resolve(null) };
        
        // Wait for completion
        const [audioResult, imageResult] = await Promise.all([audioPromise, imagePromise]);
        const totalSize = audioResult.bytesWritten + (imageResult?.bytesWritten || 0);
        
        // Mark as complete
        await completeDownload(trackId, audioLocation, imageLocation);
        await updateDownloadProgress(trackId, 1, { size: totalSize });
    } catch (error) {
        await failDownload(trackId, error instanceof Error ? error.message : 'Unknown error');
    }
}

/**
 * Remove a downloaded track
 */
export async function removeDownloadedTrack(trackId: string): Promise<void> {
    // Get the download from database
    const downloadData = await db
        .select()
        .from(require('@/store/db/schema/downloads').downloads)
        .where(eq(require('@/store/db/schema/downloads').downloads.id, trackId))
        .limit(1);
    
    const download = downloadData[0];
    
    if (download) {
        // Delete files if they exist
        if (download.filename && await exists(download.filename)) {
            await unlink(download.filename);
        }
        
        // Extract image path from metadata if present
        const metadata = download.metadataJson ? JSON.parse(download.metadataJson) : {};
        if (metadata.image && await exists(metadata.image)) {
            await unlink(metadata.image);
        }
    }
    
    // Remove from database
    await dbRemoveDownload(trackId);
}
