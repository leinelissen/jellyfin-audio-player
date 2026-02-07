/**
 * Jellyfin API to SQLite sync functions
 * 
 * Transforms Jellyfin API responses to database schema and handles sync operations
 */

import { eq } from 'drizzle-orm';
import { getDatabase } from '@/store/database/connection';
import {
  artists,
  albums,
  tracks,
  playlists,
  playlist_tracks,
  type NewArtist,
  type NewAlbum,
  type NewTrack,
  type NewPlaylist,
  type NewPlaylistTrack,
} from '@/store/database/schema';
import type {
  JellyfinArtist,
  JellyfinAlbum,
  JellyfinTrack,
  JellyfinPlaylist,
  JellyfinPlaylistItem,
} from './types';
import * as driver from './driver';

/**
 * Sync artists from Jellyfin API to SQLite
 */
export async function syncArtists(userId: string): Promise<void> {
  console.log('[Jellyfin Sync] Starting artists sync...');
  const db = await getDatabase();

  let offset = 0;
  const limit = 100;
  let totalSynced = 0;

  while (true) {
    const response = await driver.fetchArtists(userId, { offset, limit });
    
    if (response.Items.length === 0) {
      break;
    }

    // Transform and batch insert
    const artistsToInsert: NewArtist[] = response.Items.map((item) =>
      transformArtist(item)
    );

    // Insert or update artists
    for (const artist of artistsToInsert) {
      await db
        .insert(artists)
        .values(artist)
        .onConflictDoUpdate({
          target: artists.jellyfin_id,
          set: {
            name: artist.name,
            updated_at: new Date(),
          },
        });
    }

    totalSynced += artistsToInsert.length;
    console.log(
      `[Jellyfin Sync] Synced ${totalSynced}/${response.TotalRecordCount} artists`
    );

    // Check if we've fetched all items
    if (offset + limit >= response.TotalRecordCount) {
      break;
    }

    offset += limit;
  }

  console.log(`[Jellyfin Sync] Artists sync complete: ${totalSynced} total`);
}

/**
 * Sync albums from Jellyfin API to SQLite
 */
export async function syncAlbums(userId: string): Promise<void> {
  console.log('[Jellyfin Sync] Starting albums sync...');
  const db = await getDatabase();

  let offset = 0;
  const limit = 100;
  let totalSynced = 0;

  while (true) {
    const response = await driver.fetchAlbums(userId, { offset, limit });

    if (response.Items.length === 0) {
      break;
    }

    // Transform and batch insert
    for (const item of response.Items) {
      const album = await transformAlbum(item, db);
      
      if (album) {
        await db
          .insert(albums)
          .values(album)
          .onConflictDoUpdate({
            target: albums.jellyfin_id,
            set: {
              name: album.name,
              artist_id: album.artist_id,
              artist: album.artist,
              year: album.year,
              image_url: album.image_url,
              updated_at: new Date(),
            },
          });

        totalSynced++;
      }
    }

    console.log(
      `[Jellyfin Sync] Synced ${totalSynced}/${response.TotalRecordCount} albums`
    );

    // Check if we've fetched all items
    if (offset + limit >= response.TotalRecordCount) {
      break;
    }

    offset += limit;
  }

  console.log(`[Jellyfin Sync] Albums sync complete: ${totalSynced} total`);
}

/**
 * Sync tracks from Jellyfin API to SQLite
 */
export async function syncTracks(userId: string): Promise<void> {
  console.log('[Jellyfin Sync] Starting tracks sync...');
  const db = await getDatabase();

  let offset = 0;
  const limit = 100;
  let totalSynced = 0;

  while (true) {
    const response = await driver.fetchTracks(userId, undefined, {
      offset,
      limit,
    });

    if (response.Items.length === 0) {
      break;
    }

    // Transform and batch insert
    for (const item of response.Items) {
      const track = await transformTrack(item, db);

      if (track) {
        await db
          .insert(tracks)
          .values(track)
          .onConflictDoUpdate({
            target: tracks.jellyfin_id,
            set: {
              name: track.name,
              album_id: track.album_id,
              artist_id: track.artist_id,
              duration: track.duration,
              track_number: track.track_number,
              file_path: track.file_path,
              updated_at: new Date(),
            },
          });

        totalSynced++;
      }
    }

    console.log(
      `[Jellyfin Sync] Synced ${totalSynced}/${response.TotalRecordCount} tracks`
    );

    // Check if we've fetched all items
    if (offset + limit >= response.TotalRecordCount) {
      break;
    }

    offset += limit;
  }

  console.log(`[Jellyfin Sync] Tracks sync complete: ${totalSynced} total`);
}

/**
 * Sync playlists from Jellyfin API to SQLite
 */
export async function syncPlaylists(userId: string): Promise<void> {
  console.log('[Jellyfin Sync] Starting playlists sync...');
  const db = await getDatabase();

  let offset = 0;
  const limit = 100;
  let totalSynced = 0;

  while (true) {
    const response = await driver.fetchPlaylists(userId, { offset, limit });

    if (response.Items.length === 0) {
      break;
    }

    // Transform and batch insert
    const playlistsToInsert: NewPlaylist[] = response.Items.map((item) =>
      transformPlaylist(item)
    );

    for (const playlist of playlistsToInsert) {
      await db
        .insert(playlists)
        .values(playlist)
        .onConflictDoUpdate({
          target: playlists.jellyfin_id,
          set: {
            name: playlist.name,
            updated_at: new Date(),
          },
        });
    }

    totalSynced += playlistsToInsert.length;
    console.log(
      `[Jellyfin Sync] Synced ${totalSynced}/${response.TotalRecordCount} playlists`
    );

    // Check if we've fetched all items
    if (offset + limit >= response.TotalRecordCount) {
      break;
    }

    offset += limit;
  }

  console.log(`[Jellyfin Sync] Playlists sync complete: ${totalSynced} total`);
}

/**
 * Sync playlist items from Jellyfin API to SQLite
 */
export async function syncPlaylistItems(
  playlistId: string,
  userId: string
): Promise<void> {
  console.log(`[Jellyfin Sync] Starting playlist items sync for ${playlistId}...`);
  const db = await getDatabase();

  // Get the playlist from database
  const [playlist] = await db
    .select()
    .from(playlists)
    .where(eq(playlists.jellyfin_id, playlistId));

  if (!playlist) {
    console.warn(
      `[Jellyfin Sync] Playlist ${playlistId} not found in database`
    );
    return;
  }

  // Delete existing playlist tracks
  await db
    .delete(playlist_tracks)
    .where(eq(playlist_tracks.playlist_id, playlist.id));

  let offset = 0;
  const limit = 100;
  let totalSynced = 0;

  while (true) {
    const response = await driver.fetchPlaylistItems(playlistId, userId, {
      offset,
      limit,
    });

    if (response.Items.length === 0) {
      break;
    }

    // Transform and insert playlist items
    for (let i = 0; i < response.Items.length; i++) {
      const item = response.Items[i];
      const playlistTrack = await transformPlaylistTrack(
        item,
        playlist.id,
        offset + i,
        db
      );

      if (playlistTrack) {
        await db.insert(playlist_tracks).values(playlistTrack);
        totalSynced++;
      }
    }

    console.log(
      `[Jellyfin Sync] Synced ${totalSynced}/${response.TotalRecordCount} playlist items`
    );

    // Check if we've fetched all items
    if (offset + limit >= response.TotalRecordCount) {
      break;
    }

    offset += limit;
  }

  console.log(
    `[Jellyfin Sync] Playlist items sync complete: ${totalSynced} total`
  );
}

/**
 * Sync all data from Jellyfin API to SQLite
 */
export async function syncAll(userId: string): Promise<void> {
  console.log('[Jellyfin Sync] Starting full sync...');

  try {
    // Sync in order: artists -> albums -> tracks -> playlists
    await syncArtists(userId);
    await syncAlbums(userId);
    await syncTracks(userId);
    await syncPlaylists(userId);

    // Sync playlist items for all playlists
    const db = await getDatabase();
    const allPlaylists = await db.select().from(playlists);
    
    for (const playlist of allPlaylists) {
      await syncPlaylistItems(playlist.jellyfin_id, userId);
    }

    console.log('[Jellyfin Sync] Full sync complete!');
  } catch (error) {
    console.error('[Jellyfin Sync] Sync failed:', error);
    throw error;
  }
}

// Transform functions

function transformArtist(item: JellyfinArtist): NewArtist {
  return {
    name: item.Name,
    jellyfin_id: item.Id,
  };
}

async function transformAlbum(
  item: JellyfinAlbum,
  db: Awaited<ReturnType<typeof getDatabase>>
): Promise<NewAlbum | null> {
  // Get artist name from album data
  const artistName =
    item.AlbumArtist ||
    item.AlbumArtists?.[0]?.Name ||
    'Unknown Artist';

  // Find or create artist
  let artist;
  const artistId = item.AlbumArtists?.[0]?.Id;

  if (artistId) {
    [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.jellyfin_id, artistId));
  }

  if (!artist) {
    // Try to find by name
    [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.name, artistName))
      .limit(1);
  }

  if (!artist) {
    // Create unknown artist with unique ID
    const uniqueSuffix = Date.now().toString(36);
    [artist] = await db
      .insert(artists)
      .values({
        name: artistName,
        jellyfin_id: `unknown-${artistName.toLowerCase().replace(/\s+/g, '-')}-${uniqueSuffix}`,
      })
      .returning();
  }

  return {
    name: item.Name,
    artist_id: artist.id,
    artist: artistName, // Denormalized
    year: item.ProductionYear || null,
    image_url: null, // Can be computed via getImage utility
    jellyfin_id: item.Id,
  };
}

async function transformTrack(
  item: JellyfinTrack,
  db: Awaited<ReturnType<typeof getDatabase>>
): Promise<NewTrack | null> {
  // Find album
  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.jellyfin_id, item.AlbumId));

  if (!album) {
    console.warn(
      `[Jellyfin Sync] Album ${item.AlbumId} not found for track ${item.Id}`
    );
    return null;
  }

  // Get artist ID from album
  const artistId = album.artist_id;

  // Convert RunTimeTicks to milliseconds (1 tick = 100 nanoseconds)
  const duration = item.RunTimeTicks ? Math.floor(item.RunTimeTicks / 10000) : 0;

  return {
    name: item.Name,
    album_id: album.id,
    artist_id: artistId,
    duration,
    track_number: item.IndexNumber || null,
    jellyfin_id: item.Id,
    file_path: item.Path || null,
  };
}

function transformPlaylist(item: JellyfinPlaylist): NewPlaylist {
  return {
    name: item.Name,
    jellyfin_id: item.Id,
  };
}

async function transformPlaylistTrack(
  item: JellyfinPlaylistItem,
  playlistId: number,
  position: number,
  db: Awaited<ReturnType<typeof getDatabase>>
): Promise<NewPlaylistTrack | null> {
  // Find track in database
  const [track] = await db
    .select()
    .from(tracks)
    .where(eq(tracks.jellyfin_id, item.Id));

  if (!track) {
    console.warn(
      `[Jellyfin Sync] Track ${item.Id} not found for playlist item`
    );
    return null;
  }

  return {
    playlist_id: playlistId,
    track_id: track.id,
    position,
  };
}
