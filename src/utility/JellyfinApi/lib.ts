import { useTypedSelector, type AppState, type Store } from '@/store';
import { Platform } from 'react-native';
import { version } from '../../../package.json';
import { Album, AlbumTrack, ArtistItem, Playlist } from '@/store/music/types';

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

function formatImageUri(ItemId: string | number, baseUri: string): string {
    return encodeURI(`${baseUri}/Items/${ItemId}/Images/Primary?format=jpeg`);
}

/**
 * Retrieve an image URL for a given ItemId
 */
export function getImage(item: string | number | Album | AlbumTrack | Playlist | ArtistItem | null, credentials?: AppState['settings']['credentials']): string | undefined {
    // Either accept provided credentials, or retrieve them directly from the store
    const state = asyncFetchStore().getState();
    const { uri: serverUri } = credentials ?? state.settings.credentials ?? {};

    if (!item || !serverUri) {
        return undefined;
    }

    // Get the item ID
    const itemId = typeof item === 'string' || typeof item === 'number' 
        ? item 
        : 'PrimaryImageItemId' in item 
            ? item.PrimaryImageItemId || item.Id 
            : item.Id;

    // Check if we have a downloaded image for this item
    const downloadEntity = state.downloads.entities[itemId];
    if (downloadEntity?.image) {
        return downloadEntity.image;
    }

    // If no downloaded image, fall back to server URL
    if (typeof item === 'string' || typeof item === 'number') {
        if (__DEV__) {
            console.warn('useGetImage: supplied item is string or number. Please submit an item object instead.', { item });
        }
        return formatImageUri(item, serverUri);
    } else if ('PrimaryImageItemId' in item) {
        return formatImageUri(item.PrimaryImageItemId || item.Id, serverUri);
    } else if ('ImageTags' in item && item.ImageTags.Primary) {
        return formatImageUri(item.Id, serverUri);
    }

    return undefined;
}

/**
 * Create a hook that can convert ItemIds to image URLs
 */
export function useGetImage() {
    const credentials = useTypedSelector((state) => state.settings.credentials);

    return (item: Parameters<typeof getImage>[0]) => {
        return getImage(item, credentials);
    };
}