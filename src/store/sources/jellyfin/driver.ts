/**
 * Jellyfin API client driver
 * 
 * Provides methods to fetch data from Jellyfin server with retry logic
 */

import { fetchApi } from '@/utility/JellyfinApi/lib';
import type {
  JellyfinPaginationParams,
  JellyfinAlbumsResponse,
  JellyfinArtistsResponse,
  JellyfinTracksResponse,
  JellyfinPlaylistsResponse,
  JellyfinPlaylistItemsResponse,
} from './types';

const MAX_RETRIES = 5;
const INITIAL_DELAY = 100; // milliseconds

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (__DEV__ && attempt > 1) {
        console.log(
          `[Jellyfin Driver] ${operationName} - Attempt ${attempt}/${MAX_RETRIES}`
        );
      }

      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(
        `[Jellyfin Driver] ${operationName} - Attempt ${attempt} failed:`,
        error
      );

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
        const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
        if (__DEV__) {
          console.log(`[Jellyfin Driver] Retrying in ${delay}ms...`);
        }
        await sleep(delay);
      }
    }
  }

  // All retries failed
  const errorMessage = `${operationName} failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error(`[Jellyfin Driver] ${errorMessage}`);
  throw new Error(errorMessage);
}

/**
 * Build query string from pagination params
 */
function buildQueryString(params?: JellyfinPaginationParams): string {
  if (!params) return '';

  const queryParams: string[] = [];
  
  if (params.offset !== undefined) {
    queryParams.push(`StartIndex=${params.offset}`);
  }
  
  if (params.limit !== undefined) {
    queryParams.push(`Limit=${params.limit}`);
  }

  return queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
}

/**
 * Fetch albums from Jellyfin server
 */
export async function fetchAlbums(
  userId: string,
  params?: JellyfinPaginationParams
): Promise<JellyfinAlbumsResponse> {
  return withRetry(
    () => {
      const queryString = buildQueryString(params);
      return fetchApi<JellyfinAlbumsResponse>(
        `/Users/${userId}/Items${queryString}&IncludeItemTypes=MusicAlbum&Recursive=true&Fields=ProductionYear&SortBy=SortName&SortOrder=Ascending`
      );
    },
    'fetchAlbums'
  );
}

/**
 * Fetch artists from Jellyfin server
 */
export async function fetchArtists(
  userId: string,
  params?: JellyfinPaginationParams
): Promise<JellyfinArtistsResponse> {
  return withRetry(
    () => {
      const queryString = buildQueryString(params);
      return fetchApi<JellyfinArtistsResponse>(
        `/Artists${queryString}&UserId=${userId}&Recursive=true&SortBy=SortName&SortOrder=Ascending`
      );
    },
    'fetchArtists'
  );
}

/**
 * Fetch tracks from Jellyfin server
 * 
 * @param userId - The user ID
 * @param albumId - Optional album ID to filter tracks
 * @param params - Pagination parameters
 */
export async function fetchTracks(
  userId: string,
  albumId?: string,
  params?: JellyfinPaginationParams
): Promise<JellyfinTracksResponse> {
  return withRetry(
    () => {
      const queryString = buildQueryString(params);
      const albumFilter = albumId ? `&ParentId=${albumId}` : '';
      return fetchApi<JellyfinTracksResponse>(
        `/Users/${userId}/Items${queryString}&IncludeItemTypes=Audio&Recursive=true&Fields=Path${albumFilter}&SortBy=Album,SortName&SortOrder=Ascending`
      );
    },
    'fetchTracks'
  );
}

/**
 * Fetch playlists from Jellyfin server
 */
export async function fetchPlaylists(
  userId: string,
  params?: JellyfinPaginationParams
): Promise<JellyfinPlaylistsResponse> {
  return withRetry(
    () => {
      const queryString = buildQueryString(params);
      return fetchApi<JellyfinPlaylistsResponse>(
        `/Users/${userId}/Items${queryString}&IncludeItemTypes=Playlist&Recursive=true&MediaTypes=Audio&SortBy=SortName&SortOrder=Ascending`
      );
    },
    'fetchPlaylists'
  );
}

/**
 * Fetch playlist items from Jellyfin server
 */
export async function fetchPlaylistItems(
  playlistId: string,
  userId: string,
  params?: JellyfinPaginationParams
): Promise<JellyfinPlaylistItemsResponse> {
  return withRetry(
    () => {
      const queryString = buildQueryString(params);
      return fetchApi<JellyfinPlaylistItemsResponse>(
        `/Playlists/${playlistId}/Items${queryString}&UserId=${userId}`
      );
    },
    'fetchPlaylistItems'
  );
}
