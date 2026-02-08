import { xor } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { DocumentDirectoryPath, readDir } from 'react-native-fs';
import { useDownloads } from '@/store/downloads/hooks';
import { useSourceId } from '@/store/db/useSourceId';
import { downloadTrack } from '@/store/downloads/queue';
import { completeDownload } from '@/store/downloads/actions';
import { getMimeTypeForExtension } from '@/utility/mimeType';

/**
 * The maximum number of concurrent downloads we allow to take place at once.
 * This is hardcoded at 5 for now, but might be extracted to a setting later.
 */
const MAX_CONCURRENT_DOWNLOADS = 5;

/**
 * This is a component that tracks queued downloads, and starts them one-by-one,
 * so that we don't overload react-native-fs, as well as the render performance.
 */
function DownloadManager () {
    // Retrieve store helpers
    const sourceId = useSourceId();
    const { queued, ids, entities } = useDownloads();
    
    // Keep state for the currently active downloads (i.e. the downloads that
    // have actually been pushed out to react-native-fs).
    const [hasRehydratedOrphans, setHasRehydratedOrphans] = useState(false);
    const activeDownloads = useRef(new Set<string>());

    useEffect(() => {
        // GUARD: Check if the queue is empty
        if (!queued.length) {
            // If so, clear any current downloads
            activeDownloads.current.clear();
            return;
        }

        // Apparently, the queue has changed, and we need to manage
        // First, we pick the first n downloads
        const queue = queued.slice(0, MAX_CONCURRENT_DOWNLOADS);

        // We then filter for new downloads
        queue.filter((id) => !activeDownloads.current.has(id))
            .forEach((id) => {
                // We dispatch the actual call to start downloading
                downloadTrack(id);
                // And add it to the active downloads
                activeDownloads.current.add(id);
            });

        // Lastly, if something isn't part of the queue, but is of active
        // downloads, we can assume the download completed.
        xor(Array.from(activeDownloads.current), queue)
            .forEach((id) => activeDownloads.current.delete(id));

    }, [queued, activeDownloads]);

    useEffect(() => {
        // GUARD: We only run this function once
        if (hasRehydratedOrphans) {
            return;
        }

        // GUARD: Need a source ID to hydrate orphans
        if (!sourceId) {
            return;
        }

        /**
         * Whenever the store is cleared, existing downloads get "lost" because
         * the only reference we have is the store. This function checks for
         * those lost downloads and adds them to the database
         */
        async function hydrateOrphanedDownloads() {
            // Retrieve all files for this app
            const files = await readDir(DocumentDirectoryPath);

            // Loop through the mp3 files
            files.filter((file) => file.isFile())
                .forEach((file) => {
                    const [id, extension] = file.name.split('.');
                    const mimeType = getMimeTypeForExtension(extension);

                    // GUARD: Only process audio mime types
                    if (!mimeType || !mimeType.startsWith('audio')) {
                        return;
                    }

                    // GUARD: If the id is already in the store, there's nothing
                    // left for us to do.
                    if (ids.includes(id)) {
                        return;
                    }

                    // Add the download to the database
                    completeDownload(id, file.path);
                });
        }
        
        hydrateOrphanedDownloads();
        setHasRehydratedOrphans(true);
    }, [sourceId, ids, hasRehydratedOrphans, entities]);

    return null;
}

export default DownloadManager;
