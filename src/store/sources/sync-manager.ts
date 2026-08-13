import PQueue from 'p-queue';

import type { SourceDriver } from './types';
import type { EntityId } from '../types';
import { EntityType, type SyncCursor } from '../sync-cursors/types';
import {
    getIncompleteCursors,
    createCursorIfNotExists,
    updateCursorOffset,
    markCursorComplete,
    isRecentlyCompleted,
} from '../sync-cursors/db';
import { upsertArtists } from '../artists/actions';
import { upsertAlbums } from '../albums/actions';
import { upsertTracks } from '../tracks/actions';
import { upsertPlaylists } from '../playlists/actions';
import { upsertAlbumArtists } from '../album-artists/db';
import { upsertTrackArtists } from '../track-artists/db';
import { upsertAlbumSimilar } from '../album-similar/db';
import { setPlaylistTracks } from '../playlist-tracks/db';
import { updateTrackLyrics } from '../tracks/db';
import { driverRegistry } from './drivers/registry';
import { throttle } from 'lodash';

// How many items to request per API call. Large enough to minimise round-trips,
// small enough to keep individual tasks short and resumable.
const PAGE_SIZE = 500;

// A DeferredPromise pairs a Promise with its external resolve handle so that one
// part of the system can await the promise while another part resolves it on completion.
interface DeferredPromise {
    promise: Promise<void>;
    resolve: () => void;
}

/**
 * SourceSync
 *
 * Manages syncing data from all registered source drivers into the local SQLite
 * database. Drivers are resolved on demand through the global driverRegistry
 * rather than being injected at construction time.
 *
 * Work is persisted as sync_cursor rows before execution, so it survives restarts
 * and can be resumed from the last successful page. Dependent tasks (e.g. album
 * tracks after albums) are enqueued as cursors during execution and picked up by
 * the next iteration of run().
 *
 * Each enqueue method returns a Promise that resolves when all the cursors it
 * created have completed execution. For source-level methods this covers all
 * sources that were targeted; for item-level methods it covers the single cursor.
 *
 * Usage:
 *   // Omit sourceId to sync all known sources simultaneously.
 *   await manager.syncAlbums();
 *   // Pass a sourceId to target a single source.
 *   await manager.syncAlbums(sourceId);
 *   // Item-level sync always requires a specific EntityId.
 *   await manager.syncLyrics([sourceId, trackId]);
 *   await manager.run();
 */
export class SourceSync {
    /**
     * The p-queue instance that manages concurrent execution of sync tasks. Each task is a function that returns a Promise, and the queue ensures that no more than
     * `concurrency` tasks run simultaneously. Tasks are added to the queue as cursors
     * are loaded from the database, and as new cursors are registered by executors.
     */
    private queue: PQueue;

    /**
     * A map of cursor keys to DeferredPromises, used to track the completion of each cursor. When a cursor is registered via registerCursor(), a DeferredPromise is created and stored in this map under a key derived from the cursor's sourceId, entityType, and parentEntityId. When the corresponding task completes in executeTask(), the promise is resolved and removed from the map, unblocking any awaiter of the sync method that registered it.
     */
    private pending: Map<string, DeferredPromise>;

    constructor(concurrency = 10) {
        this.queue = new PQueue({ concurrency });
        this.pending = new Map();

        this.queue.on('active', throttle(() => {
            console.log('[SYNC] Starting next task. Queue size:', this.queue.size, 'Pending promises:', this.pending.size);
        }, 1000));
    }

    // -------------------------------------------------------------------------
    // Public enqueue methods
    //
    // Each method writes a cursor row to the database if one does not already
    // exist, making every call idempotent — safe to call multiple times without
    // creating duplicate work. Actual execution only happens when run() is called.
    //
    // Source-level methods (artists, albums, playlists) accept an optional
    // sourceId. When omitted, all known sources are enqueued simultaneously.
    // Item-level methods always require a full EntityId.
    //
    // Every method returns a Promise that resolves once all targeted cursors
    // have finished executing, so callers can await completion if needed.
    // -------------------------------------------------------------------------

    /** Sync all artists from one source, or all sources if omitted. */
    async syncArtists(sourceId?: string): Promise<void> {
        await this.registerCursor(sourceId, EntityType.ARTISTS);
    }

    /** Sync all albums from one source, or all sources if omitted. */
    async syncAlbums(sourceId?: string): Promise<void> {
        await this.registerCursor(sourceId, EntityType.ALBUMS);
    }

    /** Sync all tracks belonging to the given album. */
    async syncAlbumTracks([sourceId, albumId]: EntityId): Promise<void> {
        await this.registerCursor(sourceId, EntityType.ALBUM_TRACKS, albumId, EntityType.ALBUMS);
    }

    /** Sync all playlists from one source, or all sources if omitted. */
    async syncPlaylists(sourceId?: string): Promise<void> {
        await this.registerCursor(sourceId, EntityType.PLAYLISTS);
    }

    /** Sync all tracks belonging to the given playlist. */
    async syncPlaylistTracks([sourceId, playlistId]: EntityId): Promise<void> {
        await this.registerCursor(sourceId, EntityType.PLAYLIST_TRACKS, playlistId, EntityType.PLAYLISTS);
    }

    /** Sync the similar-album recommendations for the given album. */
    async syncSimilarAlbums([sourceId, albumId]: EntityId): Promise<void> {
        await this.registerCursor(sourceId, EntityType.SIMILAR_ALBUMS, albumId, EntityType.ALBUMS);
    }

    /** Sync lyrics for the given track. */
    async syncLyrics([sourceId, trackId]: EntityId): Promise<void> {
        await this.registerCursor(sourceId, EntityType.LYRICS, trackId, EntityType.ALBUM_TRACKS);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Creates a sync cursor in the database (if one doesn't already exist),
     * wires up a completion promise, and adds the task to the queue. Returns a
     * promise that resolves when all targeted cursors have completed execution.
     *
     * When sourceId is omitted the cursor is registered for every known source
     * simultaneously, and the returned promise resolves once all of them finish.
     * When sourceId is provided only that one source is targeted.
     *
     * This is the single point of truth for the "write cursor + wire up promise"
     * pattern that every enqueue method needs.
     */
    private async registerCursor(
        sourceId: string | undefined,
        entityType: EntityType,
        parentEntityId?: string,
        parentEntityType?: EntityType,
    ): Promise<void> {
        // Resolve which sources to target — one specific source, or all of them.
        const sourceIds = sourceId
            ? [sourceId]
            : [...driverRegistry.getAll().keys()];


        // Persist a cursor row for each target source so the work survives a
        // restart, then collect the completion promise for each one.
        const promises = await Promise.all(
            sourceIds.map(async (id) => {
                const cursor = await createCursorIfNotExists(id, entityType, parentEntityId, parentEntityType);

                if (!cursor) {
                    throw new Error(`Failed to create cursor for sourceId: ${id}, entityType: ${entityType}, parentEntityId: ${parentEntityId}, parentEntityType: ${parentEntityType}`);
                }

                // If the cursor was completed recently (within the last 60 seconds),
                // resolve immediately — there is nothing left to execute.
                if (isRecentlyCompleted(cursor)) {
                    this.resolvePromise(id, entityType, parentEntityId);
                    return Promise.resolve();
                }

                // Wire up the completion promise before adding to the queue so the
                // resolve handle exists by the time executeTask finishes.
                const promise = this.getOrCreatePromise(id, entityType, parentEntityId).promise;
                this.queue.add(() => this.executeTask(cursor));
                return promise;
            })
        );

        // Wait until every targeted cursor has finished executing before returning.
        await Promise.all(promises);
    }

    /**
     * Builds the composite string key used to identify a cursor in the pending map.
     * Mirrors the unique constraint on sync_cursors: (sourceId, entityType, parentEntityId).
     */
    private cursorKey(sourceId: string, entityType: EntityType, parentEntityId = ''): string {
        return `${sourceId}:${entityType}:${parentEntityId}`;
    }

    /**
     * Returns the DeferredPromise for a cursor, creating one if it doesn't exist yet.
     * Safe to call multiple times for the same key — the existing DeferredPromise is
     * returned unchanged, matching the idempotent semantics of createCursorIfNotExists.
     */
    private getOrCreatePromise(sourceId: string, entityType: EntityType, parentEntityId = ''): DeferredPromise {
        const key = this.cursorKey(sourceId, entityType, parentEntityId);

        // If a DeferredPromise already exists for this cursor, return it as-is so
        // that multiple callers share the same promise rather than creating duplicates.
        const existing = this.pending.get(key);
        if (existing) return existing;

        // Create a new DeferredPromise by extracting the resolve function out of the
        // Promise constructor so it can be called externally when the cursor completes.
        let resolve!: () => void;
        const promise = new Promise<void>((res) => { resolve = res; });
        const deferredPromise: DeferredPromise = { promise, resolve };
        this.pending.set(key, deferredPromise);
        return deferredPromise;
    }

    /**
     * Resolves and removes the DeferredPromise for a completed cursor.
     * Called immediately after markCursorComplete() in every executor, so that
     * any awaiter of the corresponding sync promise gets unblocked.
     */
    private resolvePromise(sourceId: string, entityType: EntityType, parentEntityId = ''): void {
        const key = this.cursorKey(sourceId, entityType, parentEntityId);
        const promise = this.pending.get(key);

        // Resolve the promise to unblock callers, then remove the entry so
        // completed cursors don't accumulate in the map indefinitely.
        if (promise) {
            promise.resolve();
            this.pending.delete(key);
        }
    }

    // -------------------------------------------------------------------------
    // run()
    //
    // Loads all incomplete cursors from the database and feeds them into the
    // p-queue for concurrent execution. After the queue drains, we check again
    // for new cursors — executors create child cursors as they run (e.g. album
    // pages spawning album_tracks cursors), so the loop continues until there is
    // truly nothing left to do.
    // -------------------------------------------------------------------------

    async run(): Promise<void> {
        // Load whatever incomplete work exists at this moment. On the first
        // iteration this is any previously interrupted sync plus anything
        // enqueued since the last run.
        const cursors = await getIncompleteCursors();
        if (cursors.length === 0) return;

        // Schedule every cursor as an independent task. The queue's concurrency
        // setting controls how many execute in parallel.
        for (const cursor of cursors) {
            this.queue.add(() => this.executeTask(cursor));
        }

        // Wait for this entire batch to finish before looping. Executors may
        // have written new child cursors to the database during this batch,
        // which the next iteration will pick up.
        await this.queue.onIdle();
    }

    // -------------------------------------------------------------------------
    // Task dispatch
    //
    // Looks up the driver for the cursor's source and routes to the appropriate
    // executor. If no driver is registered for that sourceId (e.g. the source
    // was removed since the cursor was written), the task is silently skipped.
    // -------------------------------------------------------------------------

    private async executeTask(cursor: SyncCursor): Promise<void> {
        // Guard against stale queue entries: if this cursor was completed recently
        // (e.g. queued twice via run() and registerCursor), resolve its promise and
        // bail out without re-fetching anything.
        if (isRecentlyCompleted(cursor)) {
            this.resolvePromise(cursor.sourceId, cursor.entityType as EntityType, cursor.parentEntityId ?? '');
            return;
        }

        // A cursor without a matching driver has nowhere to fetch from — skip it.
        const driver = driverRegistry.getById(cursor.sourceId);
        if (!driver) return;

        const { sourceId, entityType, parentEntityId, startIndex } = cursor;

        switch (entityType as EntityType) {
            case EntityType.ARTISTS:
                await this.executeArtistsPage(driver, sourceId, startIndex);
                break;
            case EntityType.ALBUMS:
                await this.executeAlbumsPage(driver, sourceId, startIndex);
                break;
            case EntityType.ALBUM_TRACKS:
                // parentEntityId is the albumId that scopes this cursor.
                await this.executeAlbumTracksPage(driver, sourceId, parentEntityId, startIndex);
                break;
            case EntityType.PLAYLISTS:
                await this.executePlaylistsPage(driver, sourceId, startIndex);
                break;
            case EntityType.PLAYLIST_TRACKS:
                // parentEntityId is the playlistId that scopes this cursor.
                await this.executePlaylistTracks(driver, sourceId, parentEntityId);
                break;
            case EntityType.SIMILAR_ALBUMS:
                // parentEntityId is the albumId whose similar albums we're fetching.
                await this.executeSimilarAlbums(driver, sourceId, parentEntityId);
                break;
            case EntityType.LYRICS:
                // parentEntityId is the trackId whose lyrics we're fetching.
                await this.executeLyrics(driver, sourceId, parentEntityId);
                break;
        }
    }

    // -------------------------------------------------------------------------
    // Entity executors
    //
    // Pagination is handled inline: when a full page is returned the cursor
    // offset is advanced in the database and the next page is pushed directly
    // onto the queue, keeping all pages of one entity type within the same
    // run() iteration.
    //
    // Child cursors (e.g. album_tracks spawned by an albums page) are written
    // to the database but NOT added to the current queue. The outer loop in
    // run() picks them up in the next iteration, which naturally sequences
    // parent work before child work without explicit dependency tracking.
    // -------------------------------------------------------------------------

    private async executeArtistsPage(
        driver: SourceDriver,
        sourceId: string,
        offset: number,
    ): Promise<void> {
        // Fetch one page of artists from the remote source, starting at offset.
        const result = await driver.getArtists({ offset, limit: PAGE_SIZE });

        // Write all artists in this page to the local database, tagging each
        // with the sourceId so they stay scoped to their origin server.
        await upsertArtists(result.items.map(a => ({
            ...a,
            sourceId,
        })));

        const newOffset = offset + result.items.length;

        if (result.items.length === PAGE_SIZE) {
            // A full page means there are likely more artists — advance the cursor
            // offset and queue the next page immediately to stay within this iteration.
            await updateCursorOffset(sourceId, EntityType.ARTISTS, newOffset);
            this.queue.add(() => this.executeArtistsPage(driver, sourceId, newOffset));
        } else {
            // A partial page means we've reached the end of the artist list.
            // Mark the cursor done and unblock any awaiter of syncArtists.
            await markCursorComplete(sourceId, EntityType.ARTISTS);
            this.resolvePromise(sourceId, EntityType.ARTISTS);
        }
    }

    private async executeAlbumsPage(
        driver: SourceDriver,
        sourceId: string,
        offset: number,
    ): Promise<void> {
        // Fetch one page of albums from the remote source.
        const result = await driver.getAlbums({ offset, limit: PAGE_SIZE });

        // Album responses often embed artist stubs (id + name only). We upsert
        // those first so the artist rows exist before album_artists references them.
        const embeddedArtists = result.items.flatMap(a => a.artistItems ?? []);
        if (embeddedArtists.length > 0) {
            await upsertArtists(embeddedArtists.map(a => ({
                ...a,
                sourceId,
            })));
        }

        // Persist the albums themselves, stripping the transient artistItems field
        // which is only used to seed relations and should not be stored on the album row.
        await upsertAlbums(result.items.map(({ artistItems: _artistItems, ...album }) => ({
            ...album,
            sourceId,
        })));

        // Now that both artists and albums exist, write the album→artist join rows.
        for (const album of result.items) {
            if (album.artistItems?.length) {
                await upsertAlbumArtists([sourceId, album.id], album.artistItems);
            }
        }

        // For each album, register child cursors for its tracks and similar albums.
        for (const album of result.items) {
            this.syncAlbumTracks([sourceId, album.id]);
            // this.syncSimilarAlbums([sourceId, album.id]);
        }

        const newOffset = offset + result.items.length;

        if (result.items.length === PAGE_SIZE) {
            // More pages remain — advance the cursor and queue the next page.
            await updateCursorOffset(sourceId, EntityType.ALBUMS, newOffset);
            this.queue.add(() => this.executeAlbumsPage(driver, sourceId, newOffset));
        } else {
            // All albums have been fetched. Mark complete and unblock any awaiter.
            await markCursorComplete(sourceId, EntityType.ALBUMS);
            this.resolvePromise(sourceId, EntityType.ALBUMS);
        }
    }

    private async executeAlbumTracksPage(
        driver: SourceDriver,
        sourceId: string,
        albumId: string,
        offset: number,
    ): Promise<void> {
        // Fetch one page of tracks for this album.
        const result = await driver.getTracksByAlbum(albumId, { offset, limit: PAGE_SIZE });

        // Track responses embed artist stubs just like album responses. Upsert them
        // first so track_artists relations can reference existing artist rows.
        const embeddedArtists = result.items.flatMap(t => t.artistItems ?? []);
        if (embeddedArtists.length > 0) {
            await upsertArtists(embeddedArtists.map(a => ({
                ...a,
                sourceId,
            })));
        }

        // Persist the tracks, stripping artistItems which belongs in the join table.
        await upsertTracks(result.items.map(({ artistItems: _artistItems, ...track }) => ({
            ...track,
            sourceId,
        })));

        for (const track of result.items) {
            // Write the track→artist join rows now that both sides exist.
            if (track.artistItems?.length) {
                await upsertTrackArtists([sourceId, track.id], track.artistItems);
            }
            // Queue a lyrics fetch for every track
            if (track.metadata?.HasLyrics) {
                this.syncLyrics([sourceId, track.id]);
            }
        }

        const newOffset = offset + result.items.length;

        if (result.items.length === PAGE_SIZE) {
            // More pages of tracks remain for this album — advance and continue.
            await updateCursorOffset(sourceId, EntityType.ALBUM_TRACKS, newOffset, albumId);
            this.queue.add(() => this.executeAlbumTracksPage(driver, sourceId, albumId, newOffset));
        } else {
            // All tracks for this album are stored. Mark complete and unblock any awaiter.
            await markCursorComplete(sourceId, EntityType.ALBUM_TRACKS, albumId);
            this.resolvePromise(sourceId, EntityType.ALBUM_TRACKS, albumId);
        }
    }

    private async executePlaylistsPage(
        driver: SourceDriver,
        sourceId: string,
        offset: number,
    ): Promise<void> {
        // Fetch one page of playlists from the remote source.
        const result = await driver.getPlaylists({ offset, limit: PAGE_SIZE });

        // Persist all playlists in this page, tagging them with the sourceId.
        await upsertPlaylists(result.items.map(p => ({
            ...p,
            sourceId,
        })));

        // For each playlist, register a child cursor to fetch its tracks. Do not
        // await — awaiting child completion from inside a task slot would deadlock
        // the queue.
        for (const playlist of result.items) {
            this.syncPlaylistTracks([sourceId, playlist.id]);
        }

        const newOffset = offset + result.items.length;

        if (result.items.length === PAGE_SIZE) {
            // More playlists remain — advance the cursor and continue.
            await updateCursorOffset(sourceId, EntityType.PLAYLISTS, newOffset);
            this.queue.add(() => this.executePlaylistsPage(driver, sourceId, newOffset));
        } else {
            // All playlists are stored. Mark complete and unblock any awaiter.
            await markCursorComplete(sourceId, EntityType.PLAYLISTS);
            this.resolvePromise(sourceId, EntityType.PLAYLISTS);
        }
    }

    /**
     * Fetches all pages of tracks for a playlist in a single execution slot,
     * then replaces the playlist's tracks atomically via setPlaylistTracks.
     * Playlist tracks are not paginated across cursors because setPlaylistTracks
     * requires the complete ordered list to perform an atomic replacement.
     */
    private async executePlaylistTracks(
        driver: SourceDriver,
        sourceId: string,
        playlistId: string,
    ): Promise<void> {
        // Accumulate track IDs in order across all pages before writing anything
        // to playlist_tracks — the final list must be complete and ordered.
        const trackIds: string[] = [];
        let offset = 0;

        while (true) {
            // Fetch the next page of tracks for this playlist.
            const result = await driver.getTracksByPlaylist(playlistId, { offset, limit: PAGE_SIZE });

            // Upsert any embedded artist stubs before writing tracks or relations.
            const embeddedArtists = result.items.flatMap(t => t.artistItems ?? []);
            if (embeddedArtists.length > 0) {
                await upsertArtists(embeddedArtists.map(a => ({
                    ...a,
                    sourceId,
                })));
            }

            // Persist the tracks themselves, stripping the transient artistItems field.
            await upsertTracks(result.items.map(({ artistItems: _artistItems, ...track }) => ({
                ...track,
                sourceId,
            })));

            for (const track of result.items) {
                // Write track→artist join rows now that both sides exist.
                if (track.artistItems?.length) {
                    await upsertTrackArtists([sourceId, track.id], track.artistItems);
                }
                // Queue a lyrics fetch for this track
                if (track.metadata?.HasLyrics) {
                    this.syncLyrics([sourceId, track.id]);
                }
                trackIds.push(track.id);
            }

            offset += result.items.length;
            // A partial page signals the end — no more tracks to fetch.
            if (result.items.length < PAGE_SIZE) break;
        }

        // Replace the playlist's track list atomically with the full ordered set
        // we accumulated, then mark the cursor complete and unblock any awaiter.
        await setPlaylistTracks([sourceId, playlistId], trackIds);
        await markCursorComplete(sourceId, EntityType.PLAYLIST_TRACKS, playlistId);
        this.resolvePromise(sourceId, EntityType.PLAYLIST_TRACKS, playlistId);
    }

    /**
     * Fetches similar albums for a single album.
     * No pagination — the API returns a bounded recommendation list and we take
     * the first page. We intentionally do NOT cascade further similar-album fetches
     * for the albums returned here, to avoid infinite recursive fan-out.
     */
    private async executeSimilarAlbums(
        driver: SourceDriver,
        sourceId: string,
        albumId: string,
    ): Promise<void> {
        // Fetch the bounded list of similar albums from the source.
        const result = await driver.getSimilarAlbums(albumId, { limit: PAGE_SIZE });

        // Upsert any embedded artist stubs before writing albums or relations.
        const embeddedArtists = result.items.flatMap(a => a.artistItems ?? []);
        if (embeddedArtists.length > 0) {
            await upsertArtists(embeddedArtists.map(a => ({
                ...a,
                sourceId,
            })));
        }

        // Persist the similar albums, stripping the transient artistItems field.
        await upsertAlbums(result.items.map(({ artistItems: _artistItems, ...album }) => ({
            ...album,
            sourceId,
        })));

        // Write album→artist join rows now that both sides exist in the database.
        for (const album of result.items) {
            if (album.artistItems?.length) {
                await upsertAlbumArtists([sourceId, album.id], album.artistItems);
            }
        }

        // Record the similarity relation itself, then mark the cursor done and
        // unblock any awaiter of syncSimilarAlbums for this album.
        await upsertAlbumSimilar([sourceId, albumId], result.items.map(a => a.id));
        await markCursorComplete(sourceId, EntityType.SIMILAR_ALBUMS, albumId);
        this.resolvePromise(sourceId, EntityType.SIMILAR_ALBUMS, albumId);
    }

    /**
     * Fetches lyrics for a single track and stores the result.
     * If the source returns null, the lyrics column is explicitly set to null
     * so we don't re-fetch on every subsequent sync.
     */
    private async executeLyrics(
        driver: SourceDriver,
        sourceId: string,
        trackId: string,
    ): Promise<void> {
        // Ask the source for lyrics. A null result means the track has none.
        const result = await driver.getTrackLyrics(trackId);

        // Persist the lyrics (or null) and mark the cursor complete so it won't
        // be retried, then unblock any awaiter of syncLyrics for this track.
        await updateTrackLyrics([sourceId, trackId], result ?? null);
        await markCursorComplete(sourceId, EntityType.LYRICS, trackId);
        this.resolvePromise(sourceId, EntityType.LYRICS, trackId);
    }
}

// Build a single shared Sync instance.
// Importing this default export gives any module access to the same queue and
// pending-promise map, so enqueue calls from different parts of the app coordinate
// correctly rather than operating on separate instances.
const Sync = new SourceSync();

export default Sync;
