import { EntityId } from '@reduxjs/toolkit';
import { xor } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { DocumentDirectoryPath, readDir } from 'react-native-fs';
import { useAppDispatch, useTypedSelector } from '@/store';
import { completeDownload, downloadTrack } from '@/store/downloads/actions';

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
    const { queued, ids, entities } = useTypedSelector((state) => state.downloads);
    const rehydrated = useTypedSelector((state) => state._persist.rehydrated);
    const dispatch = useAppDispatch();
    
    // Keep state for the currently active downloads (i.e. the downloads that
    // have actually been pushed out to react-native-fs).
    const [hasRehydratedOrphans, setHasRehydratedOrphans] = useState(false);
    const activeDownloads = useRef(new Set<EntityId>());

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
                dispatch(downloadTrack(id));
                // And add it to the active downloads
                activeDownloads.current.add(id);
            });

        // Lastly, if something isn't part of the queue, but is of active
        // downloads, we can assume the download completed.
        xor(Array.from(activeDownloads.current), queue)
            .forEach((id) => activeDownloads.current.delete(id));

    }, [queued, dispatch, activeDownloads]);

    useEffect(() => {
        // GUARD: We only run this function once
        if (hasRehydratedOrphans) {
            return;
        }

        // GUARD: If the state has not been rehydrated, we cannot check against
        // the store ids.
        if (!rehydrated) {
            return;
        }

        /**
         * Whenever the store is cleared, existing downloads get "lost" because
         * the only reference we have is the store. This function checks for
         * those lost downloads and adds them to the store
         */
        async function hydrateOrphanedDownloads() {
            // Retrieve all files for this app
            const files = await readDir(DocumentDirectoryPath);

            // Loop through the mp3 files
            files.filter((file) => file.isFile())
                .forEach((file) => {
                    const [id] = file.name.split('.');

                    // GUARD: If the id is already in the store, there's nothing
                    // left for us to do.
                    if (ids.includes(id) && file.path === entities[id]?.location) {
                        return;
                    }

                    // Add the download to the store
                    dispatch(completeDownload({ 
                        id,
                        location: file.path,
                        size: file.size,
                    }));
                });
        }
        
        hydrateOrphanedDownloads();
        setHasRehydratedOrphans(true);
    }, [rehydrated, ids, hasRehydratedOrphans, dispatch, entities]);

    return null;
}

export default DownloadManager;
