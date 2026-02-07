/**
 * Emby API client driver (Placeholder)
 * 
 * Note: Emby uses very similar API structure to Jellyfin
 * These are placeholder implementations - can be filled in when needed
 */

import { fetchApi } from '@/utility/JellyfinApi/lib';
import type {
  EmbyPaginationParams,
  EmbyAlbumsResponse,
  EmbyArtistsResponse,
  EmbyTracksResponse,
  EmbyPlaylistsResponse,
  EmbyPlaylistItemsResponse,
} from './types';

const MAX_RETRIES = 5;
const INITIAL_DELAY = 100; // milliseconds

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (__DEV__ && attempt > 1) {
        console.log(
          `[Emby Driver] ${operationName} - Attempt ${attempt}/${MAX_RETRIES}`
        );
      }

      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(
        `[Emby Driver] ${operationName} - Attempt ${attempt} failed:`,
        error
      );

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
        if (__DEV__) {
          console.log(`[Emby Driver] Retrying in ${delay}ms...`);
        }
        await sleep(delay);
      }
    }
  }

  const errorMessage = `${operationName} failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error(`[Emby Driver] ${errorMessage}`);
  throw new Error(errorMessage);
}

function buildPaginationParams(params?: EmbyPaginationParams): string {
  if (!params) return '';

  const queryParams: string[] = [];
  
  if (params.offset !== undefined) {
    queryParams.push(`StartIndex=${params.offset}`);
  }
  
  if (params.limit !== undefined) {
    queryParams.push(`Limit=${params.limit}`);
  }

  return queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
}

export async function fetchAlbums(
  userId: string,
  params?: EmbyPaginationParams
): Promise<EmbyAlbumsResponse> {
  return withRetry(
    () => {
      const paginationParams = buildPaginationParams(params);
      return fetchApi<EmbyAlbumsResponse>(
        `/Users/${userId}/Items?IncludeItemTypes=MusicAlbum&Recursive=true&Fields=ProductionYear&SortBy=SortName&SortOrder=Ascending${paginationParams}`
      );
    },
    'fetchAlbums'
  );
}

export async function fetchArtists(
  userId: string,
  params?: EmbyPaginationParams
): Promise<EmbyArtistsResponse> {
  return withRetry(
    () => {
      const paginationParams = buildPaginationParams(params);
      return fetchApi<EmbyArtistsResponse>(
        `/Artists?UserId=${userId}&Recursive=true&SortBy=SortName&SortOrder=Ascending${paginationParams}`
      );
    },
    'fetchArtists'
  );
}

export async function fetchTracks(
  userId: string,
  albumId?: string,
  params?: EmbyPaginationParams
): Promise<EmbyTracksResponse> {
  return withRetry(
    () => {
      const paginationParams = buildPaginationParams(params);
      const albumFilter = albumId ? `&ParentId=${albumId}` : '';
      return fetchApi<EmbyTracksResponse>(
        `/Users/${userId}/Items?IncludeItemTypes=Audio&Recursive=true&Fields=Path${albumFilter}&SortBy=Album,SortName&SortOrder=Ascending${paginationParams}`
      );
    },
    'fetchTracks'
  );
}

export async function fetchPlaylists(
  userId: string,
  params?: EmbyPaginationParams
): Promise<EmbyPlaylistsResponse> {
  return withRetry(
    () => {
      const paginationParams = buildPaginationParams(params);
      return fetchApi<EmbyPlaylistsResponse>(
        `/Users/${userId}/Items?IncludeItemTypes=Playlist&Recursive=true&MediaTypes=Audio&SortBy=SortName&SortOrder=Ascending${paginationParams}`
      );
    },
    'fetchPlaylists'
  );
}

export async function fetchPlaylistItems(
  playlistId: string,
  userId: string,
  params?: EmbyPaginationParams
): Promise<EmbyPlaylistItemsResponse> {
  return withRetry(
    () => {
      const paginationParams = buildPaginationParams(params);
      return fetchApi<EmbyPlaylistItemsResponse>(
        `/Playlists/${playlistId}/Items?UserId=${userId}${paginationParams}`
      );
    },
    'fetchPlaylistItems'
  );
}
