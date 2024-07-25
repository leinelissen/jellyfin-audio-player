import type { AppState, Store } from '@/store';
import { Platform } from 'react-native';
import { version } from '../../../package.json';

type Credentials = AppState['settings']['credentials'];

/** Map the output of `Platform.OS`, so that Jellyfin can understand it. */
const deviceMap: Record<typeof Platform['OS'], string> = {
    ios: 'iOS',
    android: 'Android',
    macos: 'macOS',
    web: 'Web',
    windows: 'Windows',
};

/**
 * This is a convenience function that converts a set of Jellyfin credentials
 * from the Redux store to a HTTP Header that authenticates the user against the
 * Jellyfin server.
 */
function generateConfig(credentials: Credentials): RequestInit {
    return {
        headers: {
            'X-Emby-Authorization': `MediaBrowser Client="Fintunes", Device="${deviceMap[Platform.OS]}", DeviceId="${credentials?.device_id}", Version="${version}", Token="${credentials?.access_token}"`
        }
    };
}

/**
 * Retrieve a copy of the store without getting caught in import cycles. 
 */
export function asyncFetchStore() {
    return require('@/store').default as Store;
}

export type PathOrCredentialInserter = string | ((credentials: NonNullable<Credentials>) => string);

/**
 * A convenience function that accepts a request for fetch, injects it with the
 * proper Jellyfin credentials and attempts to catch any errors along the way.
 */
export async function fetchApi<T>(path: PathOrCredentialInserter, providedConfig?: RequestInit, parseResponse?: true): Promise<T>;
export async function fetchApi(path: PathOrCredentialInserter, providedConfig: RequestInit, parseResponse: false): Promise<null>;
export async function fetchApi<T>(
    path: PathOrCredentialInserter,
    providedConfig?: RequestInit,
    parseResponse = true
) { 
    // Retrieve the latest credentials from the Redux store
    const credentials = asyncFetchStore().getState().settings.credentials;

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
        console.log(`%c[HTTP] → [${response.status}] ${url}`, 'font-weight:bold;');
        console.log('\t', config);
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
            throw new Error('FailedRequest');
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
    const credentials = asyncFetchStore().getState().settings.credentials;
    const uri = encodeURI(`${credentials?.uri}/Items/${ItemId}/Images/Primary?format=jpeg`);
    return uri;
}

/**
 * Create a hook that can convert ItemIds to image URLs
 */
export function useGetImage() {
    return (ItemId: string) => getImage(ItemId);
}