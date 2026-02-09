import { Platform } from 'react-native';
import { version } from '../../../package.json';
import { Album, AlbumTrack, ArtistItem, Playlist } from '@/store/music/types';
import { db } from '@/store';
import sources from '@/store/sources/entity';
import { useLiveQuery } from '@/store/live-queries';
import { useCallback } from 'react';

type Credentials = {
    uri: string;
    userId: string | null;
    accessToken: string | null;
    deviceId: string | null;
    type: string;
} | undefined;

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
 * from the database to a HTTP Header that authenticates the user against the
 * Jellyfin server.
 */
export function generateConfig(credentials: Credentials): RequestInit {
    const type = credentials?.type || '';
    if (type.startsWith('jellyfin')) {
        return {
            headers: {
                'Authorization': `MediaBrowser Client="Fintunes", Device="${deviceMap[Platform.OS]}", DeviceId="${credentials?.deviceId}", Version="${version}", Token="${credentials?.accessToken}"`
            }
        };
    } else if (type.startsWith('emby')) {
        return {
            headers: {
                'X-Emby-Authorization': `MediaBrowser Client="Fintunes", Device="${deviceMap[Platform.OS]}", DeviceId="${credentials?.deviceId}", Version="${version}", Token="${credentials?.accessToken}"`
            }
        };
    }
    return {};
}

/**
 * Get credentials from database
 */
export async function getCredentials(): Promise<Credentials> {
    const result = await db.select().from(sources).limit(1);
    return result[0] as Credentials;
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
    // Retrieve the latest credentials from the database
    const credentials = await getCredentials();

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
 * Note: This function is synchronous and does not check for downloaded images.
 * Downloaded images should be handled separately if needed.
 */
export function getImage(item: string | number | Album | AlbumTrack | Playlist | ArtistItem | null, credentials?: Credentials): string | undefined {
    const serverUri = credentials?.uri;

    if (!item || !serverUri) {
        return undefined;
    }

    // Return server URL for the image
    if (typeof item === 'string' || typeof item === 'number') {
        if (__DEV__) {
            console.warn('useGetImage: supplied item is string or number. Please submit an item object instead.', { item });
        }
        return formatImageUri(item, serverUri);
    } else if ('PrimaryImageItemId' in item) {
        return formatImageUri(item.PrimaryImageItemId || item.Id, serverUri);
    } else if ('AlbumId' in item) {
        return formatImageUri(item.AlbumId || item.Id, serverUri);
    } else if ('ImageTags' in item && item.ImageTags.Primary) {
        return formatImageUri(item.Id, serverUri);
    }

    return undefined;
}

/**
 * Create a hook that can convert ItemIds to image URLs
 * A hook that returns a function that can be used to generate an image source object
 * that can be used with an Image component.
 */
export function useGetImage() {
    const { data: sourceData } = useLiveQuery(db.select().from(sources).limit(1));
    const credentials = sourceData?.[0];

    return useCallback((item: Parameters<typeof getImage>[0]) => {
        return getImage(item, credentials);
    }, [credentials]);
}