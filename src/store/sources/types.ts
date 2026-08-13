/**
 * Shared Source Driver Types
 *
 * Defines common types and the base abstract class for source drivers.
 * Driver methods return types compatible with the database schema.
 */


import type { Artist as SchemaArtist } from '../artists/types';
import type { Album as SchemaAlbum } from '../albums/types';
import type { Track as SchemaTrack } from '../tracks/types';
import type { Playlist as SchemaPlaylist } from '../playlists/types';
import { InferSelectModel } from 'drizzle-orm';
import sources from './entity';

/**
 * Source types enum
 */
export enum SourceType {
    JELLYFIN_V1 = 'jellyfin.v1',
    EMBY_V1 = 'emby.v1',
}

export type Source = InferSelectModel<typeof sources>;

/**
 * Credential payload produced by CredentialGenerator and consumed by
 * setCredentials. Shared across the onboarding flow so the type is
 * defined once here rather than duplicated at each call site.
 */
export interface SourceCredentials {
    uri: string;
    userId: string;
    accessToken: string;
    deviceId: string;
    type: SourceType;
}

/**
 * Source info returned during connection
 */
export interface SourceInfo {
    id: string;
    name: string;
    version: string;
    operatingSystem?: string;
}

/**
 * Credentials
 */
export interface Credentials {
    accessToken: string;
    userId: string;
}

/**
 * List parameters for paging
 */
export interface ListParams {
    offset?: number;  // Start index
    limit?: number;   // Page size (default: 500)
}

/**
 * List result with items and paging info
 */
export interface ListResult<T> {
    items: T[];
    total: number;
    offset: number;
    limit: number;
}

/**
 * Artist entity returned from drivers.
 * sourceId, firstSyncedAt, and lastSyncedAt are omitted — they are managed
 * locally by the schema and actions, never supplied by drivers.
 * createdAt/updatedAt are optional — drivers provide source-side dates where available.
 */
export type Artist = Omit<SchemaArtist, 'sourceId' | 'firstSyncedAt' | 'lastSyncedAt' | 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
    updatedAt?: number;
};

/**
 * Album entity returned from drivers.
 * sourceId, firstSyncedAt, and lastSyncedAt are omitted — they are managed
 * locally by the schema and actions, never supplied by drivers.
 * createdAt/updatedAt are optional — drivers provide source-side dates where available.
 * Includes temporary artistItems field for relationship data.
 */
export type Album = Omit<SchemaAlbum, 'sourceId' | 'firstSyncedAt' | 'lastSyncedAt' | 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
    updatedAt?: number;
    artistItems?: Artist[];
};

/**
 * Track entity returned from drivers.
 * sourceId, firstSyncedAt, lastSyncedAt, and lyrics are omitted —
 * the sync timestamps are managed by the schema; lyrics are managed locally.
 * createdAt/updatedAt are optional — drivers provide source-side dates where available.
 * Includes temporary artistItems field for relationship data.
 */
export type Track = Omit<SchemaTrack, 'sourceId' | 'firstSyncedAt' | 'lastSyncedAt' | 'lyrics' | 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
    updatedAt?: number;
    artistItems?: Artist[];
};

/**
 * Playlist entity returned from drivers.
 * sourceId, firstSyncedAt, and lastSyncedAt are omitted — they are managed
 * locally by the schema and actions, never supplied by drivers.
 * createdAt/updatedAt are optional — drivers provide source-side dates where available.
 */
export type Playlist = Omit<SchemaPlaylist, 'sourceId' | 'firstSyncedAt' | 'lastSyncedAt' | 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
    updatedAt?: number;
};

/**
 * Search filter types
 */
export enum SearchFilterType {
    ALBUMS = 'albums',
    ARTISTS = 'artists',
    TRACKS = 'tracks',
    PLAYLISTS = 'playlists',
}

/**
 * Search filter
 */
export interface SearchFilter {
    type: SearchFilterType;
}

/**
 * Search result item
 */
export interface SearchResultItem {
    id: string;
    name: string;
    type: SearchFilterType;
    [key: string]: unknown;
}

/**
 * Codec metadata
 */
export interface CodecMetadata {
    codec?: string;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
    bitDepth?: number;
}

/**
 * A single lyric line as returned by Jellyfin/Emby.
 * `Start` is in ticks (100-nanosecond units). `Text` is the lyric line.
 */
export interface LyricLine {
    Start: number;
    Text?: string;
}

/**
 * Structured lyrics object as returned by the /Audio/{id}/Lyrics endpoint.
 * Both drivers return the same shape.
 */
export interface TrackLyrics {
    Lyrics: LyricLine[];
}

/**
 * Lyrics return type from driver methods — always the structured form.
 */
export type Lyrics = TrackLyrics;

/**
 * A single media stream entry stored in track metadata.
 * Mirrors the shape returned by both Jellyfin and Emby APIs.
 */
export interface TrackMediaStream {
    Type: 'Audio' | 'Video' | 'Subtitle' | 'EmbeddedImage' | string;
    Codec?: string;
    BitRate?: number;
    SampleRate?: number;
    Channels?: number;
    BitDepth?: number;
}

/**
 * Codec / playback metadata stored on a track.
 * Populated by `getTrackCodecMetadata` and stored in the track's `metadata`
 * column alongside the raw API response.
 */
export interface TrackCodecInfo {
    /** Whether the track is being played directly (true) or transcoded (false). */
    isDirectPlay: boolean;
    /** Content-Type header value when transcoding (e.g. "audio/aac"). */
    contentType?: string;
}

/**
 * Shape of the `metadata` JSON column on the `tracks` table.
 * Contains the full raw API response plus any locally computed fields.
 */
export interface TrackMetadata {
    /** Raw media streams from the source API, if fetched with Fields=MediaStreams. */
    MediaStreams?: TrackMediaStream[];
    /** Locally computed codec / playback info. */
    Codec?: TrackCodecInfo;
    /** Whether the source reports lyrics are available for this track. */
    HasLyrics?: boolean;
    /** Allow additional raw API fields to pass through without breaking the type. */
    [key: string]: unknown;
}

/**
 * Stream options
 */
export interface StreamOptions {
    bitrate?: number;
    maxStreamingBitrate?: number;
    audioCodec?: string;
}

/**
 * Download options
 */
export interface DownloadOptions {
    bitrate?: number;
}

/**
 * Download info
 */
export interface DownloadInfo {
    url: string;
    filename: string;
    mimetype?: string;
}

/**
 * Union of all entity types that can have artwork resolved for them.
 *
 * Every member carries a `sourceId` (used by the manager to route to the
 * correct driver) and an `id` (the stable item ID assigned by the source
 * server). Drivers receive the full entity object so they can inspect any
 * field — for example, resolving a track's art via its `albumId` column
 * rather than the track's own ID.
 */
export type ArtworkEntity =
    | SchemaArtist
    | SchemaAlbum
    | SchemaTrack
    | SchemaPlaylist;

/**
 * Options for artwork URL generation.
 */
export interface ArtworkOptions {
    /** Desired image width in pixels. Drivers may use this for server-side scaling. */
    width?: number;
    /** Desired image height in pixels. Drivers may use this for server-side scaling. */
    height?: number;
    /** Image quality (0–100). Drivers may use this for server-side compression. */
    quality?: number;
    /** Preferred output format (e.g. 'jpeg', 'png', 'webp'). Defaults to 'jpeg'. */
    format?: string;
}

/**
 * Source Driver Abstract Class
 *
 * All source drivers (Jellyfin, Emby, etc.) must extend this class.
 * Optional methods have default implementations.
 */
export abstract class SourceDriver {
    protected source: Source;

    constructor(source: Source) {
        this.source = source;
    }

    getSourceId(): string {
        return this.source.id;
    }

    /**
     * Connect to the source and retrieve server info
     */
    abstract connect(): Promise<SourceInfo>;

    /**
     * Refresh credentials (re-authenticate)
     * Default implementation throws error
     */
    refreshCredentials(): Promise<Credentials> {
        throw new Error('refreshCredentials not implemented');
    }

    /**
     * Validate current credentials
     * Default implementation tries to connect
     */
    async validateCredentials(): Promise<boolean> {
        try {
            await this.connect();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sign out from the source
     * Default implementation does nothing
     */
    async signOut(): Promise<void> {
        // Default: no-op
    }

    /**
     * Get list of artists with paging
     */
    abstract getArtists(params?: ListParams): Promise<ListResult<Artist>>;

    /**
     * Get list of albums with paging
     */
    abstract getAlbums(params?: ListParams): Promise<ListResult<Album>>;

    /**
     * Get a specific album by ID
     */
    abstract getAlbum(albumId: string): Promise<Album>;

    /**
     * Get tracks for an album with paging
     */
    abstract getTracksByAlbum(albumId: string, params?: ListParams): Promise<ListResult<Track>>;

    /**
     * Get list of playlists with paging
     */
    abstract getPlaylists(params?: ListParams): Promise<ListResult<Playlist>>;

    /**
     * Get a specific playlist by ID
     */
    abstract getPlaylist(playlistId: string): Promise<Playlist>;

    /**
     * Get tracks for a playlist with paging
     */
    abstract getTracksByPlaylist(playlistId: string, params?: ListParams): Promise<ListResult<Track>>;

    /**
     * Search for items
     */
    abstract search(query: string, filters: SearchFilter[], params?: ListParams): Promise<ListResult<SearchResultItem>>;

    /**
     * Get recent albums with paging
     */
    abstract getRecentAlbums(params?: ListParams): Promise<ListResult<Album>>;

    /**
     * Get similar albums for an album with paging
     */
    abstract getSimilarAlbums(albumId: string, params?: ListParams): Promise<ListResult<Album>>;

    /**
     * Get instant mix for an entity with paging
     */
    abstract getInstantMix(entityId: string, params?: ListParams): Promise<ListResult<Track>>;

    /**
     * Get codec metadata for a track
     */
    abstract getTrackCodecMetadata(trackId: string): Promise<CodecMetadata | null>;

    /**
     * Get lyrics for a track
     */
    abstract getTrackLyrics(trackId: string): Promise<Lyrics | null>;

    /**
     * Get stream URL for a track
     */
    abstract getStreamUrl(trackId: string, options?: StreamOptions): Promise<string>;

    /**
     * Get download info for a track
     */
    abstract getDownloadInfo(trackId: string, options?: DownloadOptions): Promise<DownloadInfo>;

    /**
     * Report playback start
     */
    abstract reportPlaybackStart(trackId: string, positionTicks: number): Promise<void>;

    /**
     * Report playback progress
     */
    abstract reportPlaybackProgress(trackId: string, positionTicks: number): Promise<void>;

    /**
     * Report playback stop
     */
    abstract reportPlaybackStop(trackId: string, positionTicks: number): Promise<void>;

    /**
     * Get an artwork URL for any entity (album, artist, track, or playlist).
     *
     * Returns a fully-qualified URL string that can be passed directly to an
     * Image component, or `undefined` if the driver cannot produce one (e.g.
     * because the source URI is missing or the entity has no image).
     *
     * Implementations should compose the URL synchronously from the known
     * `source.uri` and `source.accessToken` — no network call is required.
     * The full entity object is provided so implementations can inspect any
     * field — for example, resolving a track's art via its `albumId`.
     *
     * @param entity   The full entity object (album, artist, track, or playlist).
     * @param options  Optional hints for image dimensions, quality, and format.
     */
    abstract getArtworkUrl(
        entity: ArtworkEntity,
        options?: ArtworkOptions,
    ): string | undefined;
}


