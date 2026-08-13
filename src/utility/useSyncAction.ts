import { useCallback, useState } from 'react';

/**
 * Wraps any async function and tracks its loading state, so that
 * pull-to-refresh controls can show a spinner while the action is in progress.
 *
 * @example
 * const [isLoading, refresh] = useSyncAction(Sync.syncPlaylists);
 */
export default function useSyncAction<T extends unknown[]>(
    action: (...args: T) => Promise<unknown>,
): [boolean, (...args: T) => Promise<unknown>] {
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async (...args: T) => {
        setIsLoading(true);
        try {
            await action(...args);
        } finally {
            setIsLoading(false);
        }
    }, [action]);

    return [isLoading, refresh];
}
