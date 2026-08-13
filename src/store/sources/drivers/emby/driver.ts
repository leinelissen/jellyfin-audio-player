/**
 * Emby Source Driver
 *
 * Implements the SourceDriver interface for Emby servers.
 * Provides paging support for all list endpoints.
 */

import { Platform } from 'react-native';
import {
    Album,
    Artist,
    Playlist,
    Track,
    ListParams,
    ListResult,
    SourceDriver,
    SourceInfo,
    SearchFilter,
    SearchResultItem,
    CodecMetadata,
    Lyrics,
    StreamOptions,
    DownloadOptions,
    DownloadInfo,
    SearchFilterType,
    ArtworkEntity,
    ArtworkOptions,
} from '../../types';
import type {
    EmbyAlbum,
    EmbyTrack,
    EmbyItemsResponse,
    EmbyArtist,
    EmbyPlaylist,
    EmbySearchResult,
    EmbySystemInfo,
    DeviceMap,
    TrackOptionsOsOverrides,
} from './types';
import { APP_VERSION } from '@/CONSTANTS';

/** Map the output of `Platform.OS`, so that Emby can understand it. */
const deviceMap: DeviceMap = {
    ios: 'iOS',
    android: 'Android',
    macos: 'macOS',
    web: 'Web',
    windows: 'Windows',
};

const DEFAULT_LIMIT = 500;

/** Base query params shared across all browsable list endpoints */
const BASE_QUERY_PARAMS = {
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    Recursive: 'true',
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
} as const;

export class EmbyDriver extends SourceDriver {
    /**
     * Generate authentication headers for requests
     */
    private generateHeaders(): Record<string, string> {
        return {
            'X-Emby-Authorization': `MediaBrowser Client="Fintunes", Device="${deviceMap[Platform.OS]}", DeviceId="${this.source.deviceId}", Version="${APP_VERSION}", Token="${this.source.accessToken}"`,
        };
    }

    /**
     * A convenience wrapper to execute a request against the Emby server with
     * proper error handling and authentication headers.
     */
    private async fetch<T>(path: string, config?: RequestInit): Promise<T> {
        // Create full URL path
        const url = `${this.source.uri}${path.startsWith('/') ? '' : '/'}${path}`;

        // Execute the request with authentication headers
        const response = await fetch(url, {
            ...config,
            headers: {
                ...config?.headers,
                ...this.generateHeaders(),
            },
        });

        // GUARD: Check for HTTP errors
        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                throw new Error('AuthenticationFailed');
            } else if (response.status === 404) {
                throw new Error('ResourceNotFound');
            }
            throw new Error('FailedRequest');
        }

        return response.json();
    }

    /**
     * Connect to the Emby server
     */
    async connect(): Promise<SourceInfo> {
        const data = await this.fetch<EmbySystemInfo>('/System/Info');

        return {
            id: data.Id,
            name: data.ServerName,
            version: data.Version,
            operatingSystem: data.OperatingSystem,
        };
    }

    /**
     * Get artists with paging
     */
    async getArtists(params?: ListParams): Promise<ListResult<Artist>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const queryParams = new URLSearchParams({
            ...BASE_QUERY_PARAMS,
            Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated,Overview',
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbyArtist>>(
            `/Artists/AlbumArtists?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                metadata: item,
                createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
            })),
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Get albums with paging
     */
    async getAlbums(params?: ListParams): Promise<ListResult<Album>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const queryParams = new URLSearchParams({
            ...BASE_QUERY_PARAMS,
            SortBy: 'AlbumArtist,SortName',
            IncludeItemTypes: 'MusicAlbum',
            Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated',
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbyAlbum>>(
            `/Users/${this.source.userId}/Items?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                productionYear: item.ProductionYear ?? null,
                albumArtist: item.AlbumArtist ?? null,
                metadata: item,
                createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                artistItems:
                    item.ArtistItems?.map((artist) => ({
                        id: artist.Id,
                        name: artist.Name,
                        metadata: artist,
                    })) || [],
            })),
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Get a specific album
     */
    async getAlbum(albumId: string): Promise<Album> {
        const item = await this.fetch<EmbyAlbum>(
            `/Users/${this.source.userId}/Items/${albumId}`,
        );

        return {
            id: item.Id,
            name: item.Name,
            productionYear: item.ProductionYear ?? null,
            albumArtist: item.AlbumArtist ?? null,
            metadata: item,
            createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
            updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
            artistItems:
                item.ArtistItems?.map((artist) => ({
                    id: artist.Id,
                    name: artist.Name,
                    metadata: artist,
                })) || [],
        };
    }

    /**
     * Get tracks for an album with paging
     */
    async getTracksByAlbum(
        albumId: string,
        params?: ListParams,
    ): Promise<ListResult<Track>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const queryParams = new URLSearchParams({
            ParentId: albumId,
            SortBy: 'ParentIndexNumber,IndexNumber,SortName',
            Fields: 'MediaStreams',
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbyTrack>>(
            `/Users/${this.source.userId}/Items?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                albumId: item.AlbumId ?? null,
                album: item.Album ?? null,
                albumArtist: item.AlbumArtist ?? null,
                productionYear: item.ProductionYear ?? null,
                indexNumber: item.IndexNumber ?? null,
                parentIndexNumber: item.ParentIndexNumber ?? null,
                runTimeTicks: item.RunTimeTicks ?? null,
                metadata: item,
                createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                artistItems:
                    item.ArtistItems?.map((artist) => ({
                        id: artist.Id,
                        name: artist.Name,
                        metadata: artist,
                    })) || [],
            })),
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Get playlists with paging
     */
    async getPlaylists(params?: ListParams): Promise<ListResult<Playlist>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const queryParams = new URLSearchParams({
            ...BASE_QUERY_PARAMS,
            IncludeItemTypes: 'Playlist',
            Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated,ChildCount',
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbyPlaylist>>(
            `/Users/${this.source.userId}/Items?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                canDelete: item.CanDelete || false,
                childCount: item.ChildCount ?? null,
                metadata: item,
                createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
            })),
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Get a specific playlist
     */
    async getPlaylist(playlistId: string): Promise<Playlist> {
        const item = await this.fetch<EmbyPlaylist>(
            `/Users/${this.source.userId}/Items/${playlistId}`,
        );

        return {
            id: item.Id,
            name: item.Name,
            canDelete: item.CanDelete || false,
            childCount: item.ChildCount ?? null,
            metadata: item,
            createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
            updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
        };
    }

    /**
     * Get tracks for a playlist with paging
     */
    async getTracksByPlaylist(
        playlistId: string,
        params?: ListParams,
    ): Promise<ListResult<Track>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const queryParams = new URLSearchParams({
            SortBy: 'IndexNumber,SortName',
            UserId: this.source.userId || '',
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbyTrack>>(
            `/Playlists/${playlistId}/Items?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                albumId: item.AlbumId ?? null,
                album: item.Album ?? null,
                albumArtist: item.AlbumArtist ?? null,
                productionYear: item.ProductionYear ?? null,
                indexNumber: item.IndexNumber ?? null,
                parentIndexNumber: item.ParentIndexNumber ?? null,
                runTimeTicks: item.RunTimeTicks ?? null,
                metadata: item,
                createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                artistItems:
                    item.ArtistItems?.map((artist) => ({
                        id: artist.Id,
                        name: artist.Name,
                        metadata: artist,
                    })) || [],
            })),
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Search for items
     */
    async search(
        query: string,
        filters: SearchFilter[],
        params?: ListParams,
    ): Promise<ListResult<SearchResultItem>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const IncludeItemTypes = filters
            .map((filter) => {
                switch (filter.type) {
                    case SearchFilterType.ALBUMS:
                        return 'MusicAlbum';
                    case SearchFilterType.TRACKS:
                        return 'Audio';
                    case SearchFilterType.PLAYLISTS:
                        return 'Playlist';
                    case SearchFilterType.ARTISTS:
                        return 'Artist';
                    default:
                        return null;
                }
            })
            .filter((type) => type !== null)
            .join(',');

        const queryParams = new URLSearchParams({
            ...BASE_QUERY_PARAMS,
            SortBy: 'SearchScore,Album,SortName',
            IncludeItemTypes,
            Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo,DateCreated,Overview',
            SearchTerm: query,
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbySearchResult>>(
            `/Users/${this.source.userId}/Items?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                type:
                    item.Type === 'MusicAlbum'
                        ? 'albums'
                        : item.Type === 'Audio'
                            ? 'tracks'
                            : 'playlists',
            })) as SearchResultItem[],
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Get recent albums
     */
    async getRecentAlbums(params?: ListParams): Promise<ListResult<Album>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const queryParams = new URLSearchParams({
            ...BASE_QUERY_PARAMS,
            SortBy: 'DateCreated',
            SortOrder: 'Descending',
            IncludeItemTypes: 'MusicAlbum',
            Fields: 'DateCreated',
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbyAlbum>>(
            `/Users/${this.source.userId}/Items?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                productionYear: item.ProductionYear ?? null,
                albumArtist: item.AlbumArtist ?? null,
                metadata: item,
                createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                artistItems:
                    item.ArtistItems?.map((artist) => ({
                        id: artist.Id,
                        name: artist.Name,
                        metadata: artist,
                    })) || [],
            })),
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Get similar albums
     */
    async getSimilarAlbums(
        albumId: string,
        params?: ListParams,
    ): Promise<ListResult<Album>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const queryParams = new URLSearchParams({
            userId: this.source.userId || '',
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbyAlbum>>(
            `/Items/${albumId}/Similar?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                productionYear: item.ProductionYear ?? null,
                albumArtist: item.AlbumArtist ?? null,
                metadata: item,
                createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                artistItems:
                    item.ArtistItems?.map((artist) => ({
                        id: artist.Id,
                        name: artist.Name,
                        metadata: artist,
                    })) || [],
            })),
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Get instant mix
     */
    async getInstantMix(entityId: string, params?: ListParams): Promise<ListResult<Track>> {
        const offset = params?.offset || 0;
        const limit = params?.limit || DEFAULT_LIMIT;

        const queryParams = new URLSearchParams({
            UserId: this.source.userId || '',
            StartIndex: offset.toString(),
            Limit: limit.toString(),
        });

        const response = await this.fetch<EmbyItemsResponse<EmbyTrack>>(
            `/Items/${entityId}/InstantMix?${queryParams}`,
        );

        return {
            items: response.Items.map((item) => ({
                id: item.Id,
                name: item.Name,
                albumId: item.AlbumId ?? null,
                album: item.Album ?? null,
                albumArtist: item.AlbumArtist ?? null,
                productionYear: item.ProductionYear ?? null,
                indexNumber: item.IndexNumber ?? null,
                parentIndexNumber: item.ParentIndexNumber ?? null,
                runTimeTicks: item.RunTimeTicks ?? null,
                metadata: item,
                createdAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : undefined,
                artistItems:
                    item.ArtistItems?.map((artist) => ({
                        id: artist.Id,
                        name: artist.Name,
                        metadata: artist,
                    })) || [],
            })),
            total: response.TotalRecordCount,
            offset,
            limit,
        };
    }

    /**
     * Get track codec metadata
     */
    async getTrackCodecMetadata(trackId: string): Promise<CodecMetadata | null> {
        const url = await this.getStreamUrl(trackId);
        const response = await fetch(url, { method: 'HEAD' });

        return {
            codec: response.headers.get('Content-Type') || undefined,
            bitrate: response.headers.has('Content-Length') ? undefined : undefined,
        };
    }

    /**
     * Get track lyrics
     */
    async getTrackLyrics(trackId: string): Promise<Lyrics | null> {
        try {
            return await this.fetch<Lyrics>(`/Audio/${trackId}/Lyrics`);
        } catch {
            return null;
        }
    }

    /**
     * Get stream URL for a track
     */
    async getStreamUrl(
        trackId: string,
        options?: StreamOptions,
    ): Promise<string> {
        const trackOptionsOsOverrides: TrackOptionsOsOverrides = {
            ios: {
                Container:
                    'mp3,aac,m4a|aac,m4b|aac,flac,alac,m4a|alac,m4b|alac,wav,m4a,aiff,aif',
            },
            android: {
                Container:
                    'mp3,aac,flac,wav,ogg,ogg|vorbis,ogg|opus,mka|mp3,mka|opus,mka|mp3',
            },
            macos: {},
            web: {},
            windows: {},
        };

        const queryParams = new URLSearchParams({
            TranscodingProtocol: 'http',
            TranscodingContainer: 'aac',
            AudioCodec: options?.audioCodec || 'aac',
            Container: 'mp3,aac',
            audioBitRate: (options?.bitrate || 320000).toString(),
            UserId: this.source.userId || '',
            api_key: this.source.accessToken || '',
            DeviceId: this.source.deviceId || '',
            ...trackOptionsOsOverrides[Platform.OS],
        });

        return `${this.source.uri}/Audio/${trackId}/universal?${queryParams}`;
    }

    /**
     * Get download info for a track
     */
    async getDownloadInfo(
        trackId: string,
        options?: DownloadOptions,
    ): Promise<DownloadInfo> {
        const url = await this.getStreamUrl(trackId, { bitrate: options?.bitrate });

        return {
            url,
            filename: `${trackId}.mp3`,
            mimetype: 'audio/mpeg',
        };
    }

    /**
     * Report playback start
     */
    async reportPlaybackStart(
        trackId: string,
        positionTicks: number,
    ): Promise<void> {
        const payload = {
            ItemId: trackId,
            PositionTicks: positionTicks,
            MediaSourceId: trackId,
            CanSeek: true,
            PlayMethod: 'transcode',
        };

        await this.fetch('/Sessions/Playing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch((err) => console.error('Failed to report playback start:', err));
    }

    /**
     * Report playback progress
     */
    async reportPlaybackProgress(
        trackId: string,
        positionTicks: number,
    ): Promise<void> {
        const payload = {
            ItemId: trackId,
            PositionTicks: positionTicks,
            MediaSourceId: trackId,
            IsPaused: false,
            CanSeek: true,
            PlayMethod: 'transcode',
        };

        await this.fetch('/Sessions/Playing/Progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch((err) => console.error('Failed to report playback progress:', err));
    }

    /**
     * Report playback stop
     */
    async reportPlaybackStop(
        trackId: string,
        positionTicks: number,
    ): Promise<void> {
        const payload = {
            ItemId: trackId,
            PositionTicks: positionTicks,
            MediaSourceId: trackId,
        };

        await this.fetch('/Sessions/Playing/Stopped', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(err => console.error('Failed to report playback stop:', err));
    }

    /**
     * Get an artwork URL for any entity (album, artist, track, or playlist).
     *
     * Emby exposes artwork through the unified `/Items/:id/Images/Primary`
     * endpoint, which accepts optional server-side scaling and quality parameters.
     * The access token is appended as a query param so the URL can be used
     * directly in an <Image> without extra headers.
     *
     * For tracks, artwork is stored on the parent album in Emby, so we
     * resolve via `albumId` when present and fall back to the track's own ID.
     */
    getArtworkUrl(
        entity: ArtworkEntity,
        options?: ArtworkOptions,
    ): string | undefined {
        if (!this.source.uri) {
            return undefined;
        }

        // For tracks, prefer the parent album's ID since Emby attaches
        // album art to the album item, not to individual track items.
        const imageId = 'albumId' in entity && entity.albumId
            ? entity.albumId
            : entity.id;

        const format = options?.format ?? 'jpeg';
        const params = new URLSearchParams({ format });

        if (options?.width !== undefined) {
            params.set('maxWidth', options.width.toString());
        }
        if (options?.height !== undefined) {
            params.set('maxHeight', options.height.toString());
        }
        if (options?.quality !== undefined) {
            params.set('quality', options.quality.toString());
        }
        if (this.source.accessToken) {
            params.set('api_key', this.source.accessToken);
        }

        return encodeURI(
            `${this.source.uri}/Items/${imageId}/Images/Primary?${params}`,
        );
    }
}
