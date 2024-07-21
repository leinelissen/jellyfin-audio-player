import type { AppState, Store } from '@/store';

type Credentials = AppState['settings']['jellyfin'];

/**
 * This is a convenience function that converts a set of Jellyfin credentials
 * from the Redux store to a HTTP Header that authenticates the user against the
 * Jellyfin server.
 */
function generateConfig(credentials: Credentials): RequestInit {
    return {
        headers: {
            'X-Emby-Authorization': `MediaBrowser Client="", Device="", DeviceId="", Version="", Token="${credentials?.access_token}"`
        }
    };
}

export function asyncFetchStore() {
    return require('@/store').default as Store;
}

/**
 * A convenience function that accepts a request for fetch, injects it with the
 * proper Jellyfin credentials and attempts to catch any errors along the way.
 */
export async function fetchApi<T>(
    path: string | ((credentials: NonNullable<Credentials>) => string),
    providedConfig?: RequestInit,
    parseResponse = true
) { 
    // Retrieve the latest credentials from the Redux store
    const credentials = asyncFetchStore().getState().settings.jellyfin;

    // GUARD: Check that the credentials are present
    if (!credentials) {
        throw new Error('Missing Jellyfin credentials when attempting API request');
    }

    // Create the URL from the path and the credentials
    const resolvedPath = typeof path === 'function' ? path(credentials) : path;
    const url = `${credentials.uri}${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;

    // Create config
    const config = {
        ...providedConfig,
        headers: {
            ...providedConfig?.headers,
            ...generateConfig(credentials).headers,
        }
    };
    
    // Actually perform the request
    const response = await fetch(url, config);

    if (__DEV__) {
        console.log(`[HTTP][${response.status}]`, url, config);
    }

    // GUARD: Check if the response is as expected
    if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
            throw new Error('AuthenticationFailed');
        } else if (response.status === 404) {
            throw new Error('ResourceNotFound');
        }

        // Attempt to parse the error message
        try {
            const data = await response.json();
            throw data;
        } catch {
            throw response;
        }
    }

    if (parseResponse) {
        // Parse body as JSON
        const data = await response.json() as Promise<T>;
    
        return data;
    }

    return null;
}

/**
 * Retrieve an image URL for a given ItemId
 */
export function getImage(ItemId: string): string {
    const credentials = asyncFetchStore().getState().settings.jellyfin;
    return encodeURI(`${credentials?.uri}/Items/${ItemId}/Images/Primary?format=jpeg`);
}

/**
 * Create a hook that can convert ItemIds to image URLs
 */
export function useGetImage() {
    return (ItemId: string) => getImage(ItemId);
}