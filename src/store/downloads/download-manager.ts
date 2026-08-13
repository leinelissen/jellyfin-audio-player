/**
 * DownloadQueue
 *
 * A self-running singleton that manages all track downloads. It owns a p-queue
 * so that no more than MAX_CONCURRENT_DOWNLOADS transfers run at the same time,
 * and it uses an in-memory Set to guarantee that the same track is never pushed
 * onto the queue twice.
 *
 * Public API:
 *   Downloads.enqueue(track)             — write the DB row and immediately push the task
 *   Downloads.remove(download)           — cancel (if active), delete files, remove the row
 *   Downloads.hydrateOrphans()           — recover audio files missing from the DB
 *
 * File layout:
 *   <DocumentDirectoryPath>/audio/<sourceId>_<trackId>.<ext>
 *   <DocumentDirectoryPath>/artwork/<sourceId>_<trackId>.jpg
 *
 * Execution flow for a single track:
 *   enqueue() → initialiseDownload() → queue.add(executeDownload())
 *   executeDownload() → driverRegistry → driver.getDownloadInfo()   → RNFS.downloadFile() (audio)
 *                                      → driver.getArtworkUrl()     → RNFS.downloadFile() (artwork)
 *                    → completeDownload() | failDownload()
 */

import RNFS from 'react-native-fs';
import PQueue from 'p-queue';
import { driverRegistry } from '@/store/sources/drivers/registry';
import type { SourceDriver } from '@/store/sources/types';
import { getMimeTypeForExtension } from '@/utility/mimeType';
import {
    initialiseDownload,
    completeDownload,
    failDownload,
    removeDownload,
    updateDownloadProgress,
    getAllDownloads,
} from './actions';
import type { Track } from '@/store/tracks/types';
import type { Download } from './types';
import type { EntityId } from '@/store/types';


const MAX_CONCURRENT_DOWNLOADS = 5;

/** Subdirectory for audio files. */
const AUDIO_DIR = `${RNFS.DocumentDirectoryPath}/audio`;

/** Subdirectory for artwork files. */
const ARTWORK_DIR = `${RNFS.DocumentDirectoryPath}/artwork`;

/** Ensure both storage directories exist. Called once at module load. */
async function ensureDirectories(): Promise<void> {
    await Promise.all([
        RNFS.mkdir(AUDIO_DIR),
        RNFS.mkdir(ARTWORK_DIR),
    ]);
}

class DownloadQueue {
    /**
     * p-queue instance — tasks are executed as soon as they are added, up to
     * MAX_CONCURRENT_DOWNLOADS running concurrently at any given time.
     */
    private queue: PQueue;

    /**
     * Entity keys (`sourceId:trackId`) for every track currently sitting in the
     * queue or actively transferring. Checked before every enqueue() call to
     * prevent duplicate tasks.
     */
    private active: Set<string>;

    /**
     * RNFS job handles keyed by entity key (`sourceId:trackId`). Stored so that
     * remove() can abort an in-progress audio transfer before deleting the file
     * and the DB row.
     */
    private jobs: Map<string, { jobId: number; promise: Promise<RNFS.DownloadResult> }>;

    constructor(concurrency = MAX_CONCURRENT_DOWNLOADS) {
        this.queue = new PQueue({ concurrency });
        this.active = new Set();
        this.jobs = new Map();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Queue a track for download.
     *
     * Immediately pushes an execution task onto the queue. The DB row is written
     * inside executeDownload once the filename and MIME type are known. Safe to
     * call multiple times for the same track — duplicate calls are ignored while
     * the track is already active.
     */
    async enqueue(track: Track): Promise<void> {
        const key = this.entityKey(track.sourceId, track.id);

        // Bail out early if this track is already queued or transferring —
        // p-queue would happily accept a second task for the same track
        // otherwise, leading to duplicate transfers and DB conflicts.
        if (this.active.has(key)) {
            return;
        }

        this.active.add(key);
        // p-queue starts the task immediately if a concurrency slot is free,
        // otherwise it holds it until one becomes available.
        this.queue.add(() => this.executeDownload(track.sourceId, track.id));
    }

    /**
     * Remove a downloaded or queued track.
     *
     * Aborts the RNFS transfer if one is running, deletes both the audio and
     * artwork files from disk if they exist, and removes the DB row. The track
     * is also removed from the active set so it can be re-enqueued later.
     */
    async remove(download: Download): Promise<void> {
        const { sourceId, id: trackId } = download;
        const key = this.entityKey(sourceId, trackId);

        // If a transfer is currently running, stop it before we touch the file
        // on disk — otherwise RNFS may write more bytes after we've unlinked,
        // recreating a partial file.
        const job = this.jobs.get(key);
        if (job) {
            try {
                RNFS.stopDownload(job.jobId);
            } catch {
                // stopDownload throws if the job has already finished — safe to ignore.
            }
            this.jobs.delete(key);
        }

        // Remove from the active set so a subsequent enqueue() is accepted.
        this.active.delete(key);

        // Delete both the audio and artwork files. deleteFile() is a no-op when
        // the path is absent, so missing files are not treated as errors.
        if (download.filename) {
            await this.deleteFile(download.filename);
        }

        if (download.artworkPath) {
            await this.deleteFile(download.artworkPath);
        }

        await removeDownload([sourceId, trackId]);
    }

    /**
     * Scan the audio directory for files that have no corresponding row in the
     * downloads table, and re-insert them as complete downloads.
     *
     * This recovers tracks that were downloaded before the DB was wiped (e.g.
     * after a store migration) without needing to re-transfer any data.
     *
     * Called automatically at module load time.
     */
    async hydrateOrphans(): Promise<void> {
        const existingDownloads = await getAllDownloads();

        let files: RNFS.ReadDirItem[];
        try {
            files = await RNFS.readDir(AUDIO_DIR);
        } catch (error) {
            console.warn('[DownloadQueue] Could not read audio directory', error);
            return;
        }

        // Build a set of track IDs that already have a DB row so we can skip
        // them in O(1) rather than scanning the array for each file.
        const existingIds = new Set(existingDownloads.map(d => d.id));

        // Filenames are written as `sourceId-trackId.<ext>` — parse both parts
        // back out so we can reconstruct the EntityId for each orphan.
        const audioFiles = files
            .filter(f => f.isFile())
            .flatMap((file) => {
                // Files without an extension can't have a recognisable MIME type.
                const dotIndex = file.name.lastIndexOf('.');
                if (dotIndex === -1) return [];

                const stem = file.name.slice(0, dotIndex);
                const extension = file.name.slice(dotIndex + 1);
                const mimeType = getMimeTypeForExtension(extension);

                // Skip non-audio files (e.g. artwork, temp files, OS metadata).
                if (!mimeType || !mimeType.startsWith('audio')) return [];

                // The stem is `sourceId-trackId` — split on the first dash.
                const index = stem.indexOf('-');
                if (index === -1) return [];

                const sourceId = stem.slice(0, index);
                const trackId = stem.slice(index + 1);

                // Already in the DB — nothing to recover.
                if (existingIds.has(trackId)) return [];

                return [{ sourceId, trackId, filename: `${AUDIO_DIR}/${file.name}`, mimeType, fileSize: Number(file.size) }];
            });

        if (!audioFiles.length) return;

        // Insert each orphan as a complete download so it shows up in the UI
        // immediately without needing to re-transfer any data.
        await Promise.all(
            audioFiles.map(async ({ sourceId, trackId, filename, mimeType, fileSize }) => {
                await initialiseDownload([sourceId, trackId], { filename, mimetype: mimeType, fileSize });
                await completeDownload([sourceId, trackId], { filename, fileSize });
            })
        );
    }

    // -------------------------------------------------------------------------
    // Internal execution
    // -------------------------------------------------------------------------

    /**
     * Perform the actual file transfer for a single track.
     *
     * Resolves the appropriate driver, downloads the audio file into AUDIO_DIR
     * and the artwork into ARTWORK_DIR, both named `sourceId-trackId.<ext>`.
     * Calls completeDownload() on success or failDownload() on any error.
     *
     * Always cleans up the active set and jobs map on exit, regardless of outcome.
     */
    private async executeDownload(sourceId: string, trackId: string): Promise<void> {
        const entityId: EntityId = [sourceId, trackId];
        const entitySlug = `${sourceId}-${trackId}`;

        try {
            // Resolve the driver for this source. If the source was removed
            // since the row was written, there is nothing we can do.
            const driver = driverRegistry.getById(sourceId);
            if (!driver) throw new Error(`No driver found for source ${sourceId}`);

            // ---- Resolve download info ----------------------------------------

            // Ask the driver for the stream URL and container format. The driver
            // may perform an API call here to obtain a transcoded stream URL.
            const downloadInfo = await driver.getDownloadInfo(trackId);
            const { url, mimetype } = downloadInfo;

            // Derive the file extension from the MIME type so the audio player
            // can identify the format without inspecting the file contents.
            // Fall back to mp3 if the driver doesn't provide a MIME type —
            // most Jellyfin/Emby streams are transcoded to mp3 anyway.
            if (!mimetype) throw new Error(`Could not determine MIME type for track ${trackId}`);
            const extension = mimetype.split('/')[1] ?? 'mp3';
            const audioPath = `${AUDIO_DIR}/${entitySlug}.${extension}`;

            // Persist the MIME type and target path before the transfer begins
            // so the row reflects intent even if the app is killed mid-download.
            await initialiseDownload(entityId, { mimetype, filename: audioPath });

            // ---- Audio transfer --------------------------------------------------

            // If the file is already present (e.g. this track was previously
            // downloaded, the DB was wiped, and hydrateOrphans re-enqueued it),
            // skip the network transfer and mark the row complete immediately.
            if (await RNFS.exists(audioPath)) {
                const stat = await RNFS.stat(audioPath);
                await completeDownload(entityId, { filename: audioPath, fileSize: Number(stat.size) });
                return;
            }

            const { jobId, promise } = RNFS.downloadFile({
                fromUrl: url,
                toFile: audioPath,
                progress: (res) => {
                    // contentLength is 0 for chunked transfers — skip the update
                    // rather than reporting nonsensical progress values.
                    if (res.contentLength > 0) {
                        const progress = res.bytesWritten / res.contentLength;
                        updateDownloadProgress(entityId, progress).catch(() => {/* ignore */});
                    }
                },
            });

            // Store the job handle so remove() can abort the transfer if the
            // user deletes the track while it is still in flight.
            this.jobs.set(this.entityKey(sourceId, trackId), { jobId, promise });

            const result = await promise;

            if (result.statusCode < 200 || result.statusCode >= 300) {
                throw new Error(`Audio transfer failed with status ${result.statusCode}`);
            }

            // ---- Artwork transfer ------------------------------------------------

            // Artwork is best-effort — a failure here does not fail the download.
            const artworkPath = await this.downloadArtwork(driver, sourceId, trackId, entitySlug);

            // ---- Persist completion ---------------------------------------------

            await completeDownload(entityId, { filename: audioPath, fileSize: result.bytesWritten, artworkPath });

        } catch (error) {
            console.error('[DownloadQueue] Download failed for track', trackId, error);
            await failDownload(entityId);
        } finally {
            // Always clean up regardless of outcome so the slot is freed and
            // a subsequent enqueue() for the same track is accepted.
            const key = this.entityKey(sourceId, trackId);
            this.active.delete(key);
            this.jobs.delete(key);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Builds the composite string key used to identify an entity in the active
     * set and jobs map. Mirrors the EntityId tuple as a string so that tracks
     * from different sources never collide even when they share the same item ID.
     */
    private entityKey(sourceId: string, trackId: string): string {
        return `${sourceId}:${trackId}`;
    }

    /**
     * Attempt to download artwork for a track into ARTWORK_DIR.
     *
     * Returns the absolute path to the saved file on success, or undefined if
     * the driver has no artwork URL or the transfer fails. Artwork failure is
     * always non-fatal — the audio download has already succeeded at this point.
     */
    private async downloadArtwork(
        driver: SourceDriver,
        sourceId: string,
        trackId: string,
        entitySlug: string,
    ): Promise<string | undefined> {
        try {
            // getArtworkUrl is synchronous — it builds the URL from the cached
            // source credentials without a network round-trip. Returns undefined
            // when the entity has no image or the source URI is missing.
            const artworkUrl = driver.getArtworkUrl({ sourceId, id: trackId } as Parameters<typeof driver.getArtworkUrl>[0]);
            if (!artworkUrl) return undefined;

            // Artwork is always saved as JPEG regardless of what the server
            // actually returns, since that is what drivers produce by default.
            const artworkDest = `${ARTWORK_DIR}/${entitySlug}.jpg`;

            const result = await RNFS.downloadFile({
                fromUrl: artworkUrl,
                toFile: artworkDest,
            }).promise;

            if (result.statusCode < 200 || result.statusCode >= 300) {
                throw new Error(`Artwork transfer failed with status ${result.statusCode}`);
            }

            return artworkDest;
        } catch (error) {
            // Artwork failure is intentionally swallowed here — the caller has
            // already written the audio file successfully and we don't want to
            // roll that back just because the album art couldn't be fetched.
            console.warn('[DownloadQueue] Could not download artwork for track', trackId, error);
            return undefined;
        }
    }

    /**
     * Delete a file from disk, ignoring errors if it no longer exists.
     */
    private async deleteFile(path: string): Promise<void> {
        try {
            // Paths stored in the DB are absolute, but guard against relative
            // paths just in case an older row pre-dates the AUDIO_DIR layout.
            const absPath = path.startsWith('/') ? path : `${RNFS.DocumentDirectoryPath}/${path}`;

            // Check existence first — unlink throws on a missing file, and we
            // don't want a missing artwork file to surface as an error to the user.
            if (await RNFS.exists(absPath)) {
                await RNFS.unlink(absPath);
            }
        } catch (error) {
            console.warn('[DownloadQueue] Could not delete file', path, error);
        }
    }
}

/**
 * The global download queue.
 *
 * Import this wherever a download operation is needed:
 *
 *   import { Downloads } from '@/store/downloads/download-manager';
 *
 *   await Downloads.enqueue(track);
 *   await Downloads.remove(download);
 */
export const Downloads = new DownloadQueue();

// Ensure storage directories exist and scan for orphaned audio files, both
// running concurrently at module load time.
ensureDirectories();
Downloads.hydrateOrphans();
