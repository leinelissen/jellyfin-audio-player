import { db, sqliteDb } from '@/store/db';
import { albums } from '@/store/albums/albums';
import { artists } from '@/store/artists/artists';
import { tracks } from '@/store/tracks/tracks';
import { playlists } from '@/store/playlists/playlists';
import { albumArtists } from '@/store/db/schema/album-artists';
import { trackArtists } from '@/store/db/schema/track-artists';
import { playlistTracks } from '@/store/db/schema/playlist-tracks';
import { albumSimilar } from '@/store/db/schema/album-similar';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type { Album, AlbumTrack, MusicArtist, Playlist } from './types';

/**
 * ALBUMS
 */

export async function getAllAlbums() {
    const result = await db.select().from(albums);
    return result.map(album => enrichAlbum(album));
}

export async function getAlbum(id: string) {
    const result = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
    if (!result[0]) return undefined;
    return enrichAlbum(result[0]);
}

export async function getRecentAlbums(limit: number = 50) {
    const result = await db
        .select()
        .from(albums)
        .orderBy(desc(albums.dateCreated))
        .limit(limit);
    return result.map(album => enrichAlbum(album));
}

export async function upsertAlbum(sourceId: string, album: Album) {
    const now = Date.now();
    const metadata = extractAlbumMetadata(album);

    await db.insert(albums).values({
        sourceId,
        id: album.Id,
        name: album.Name,
        productionYear: album.ProductionYear || null,
        isFolder: album.IsFolder,
        albumArtist: album.AlbumArtist || null,
        dateCreated: album.DateCreated ? new Date(album.DateCreated).getTime() : now,
        lastRefreshed: now,
        metadataJson: JSON.stringify(metadata),
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: albums.id,
        set: {
            name: album.Name,
            productionYear: album.ProductionYear || null,
            albumArtist: album.AlbumArtist || null,
            lastRefreshed: now,
            metadataJson: JSON.stringify(metadata),
            updatedAt: now,
        },
    });

    // Update album-artist relations
    await updateAlbumArtists(sourceId, album.Id, album.AlbumArtists);

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertAlbums(sourceId: string, albumList: Album[]) {
    for (const album of albumList) {
        await upsertAlbum(sourceId, album);
    }
}

export async function getSimilarAlbums(albumId: string) {
    const relations = await db
        .select()
        .from(albumSimilar)
        .where(eq(albumSimilar.albumId, albumId));
    
    if (relations.length === 0) return [];

    const similarIds = relations.map(r => r.similarAlbumId);
    const result = await db
        .select()
        .from(albums)
        .where(inArray(albums.id, similarIds));
    
    return result.map(album => enrichAlbum(album));
}

export async function setSimilarAlbums(sourceId: string, albumId: string, similarAlbumIds: string[]) {
    // Delete existing relations
    await db.delete(albumSimilar).where(eq(albumSimilar.albumId, albumId));

    // Insert new relations
    if (similarAlbumIds.length > 0) {
        await db.insert(albumSimilar).values(
            similarAlbumIds.map(similarId => ({
                sourceId,
                albumId,
                similarAlbumId: similarId,
            }))
        );
    }

    sqliteDb.flushPendingReactiveQueries();
}

/**
 * ARTISTS
 */

export async function getAllArtists() {
    const result = await db.select().from(artists);
    return result.map(artist => enrichArtist(artist));
}

export async function upsertArtist(sourceId: string, artist: MusicArtist) {
    const now = Date.now();
    const metadata = extractArtistMetadata(artist);

    await db.insert(artists).values({
        sourceId,
        id: artist.Id,
        name: artist.Name,
        isFolder: artist.IsFolder,
        metadataJson: JSON.stringify(metadata),
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: artists.id,
        set: {
            name: artist.Name,
            metadataJson: JSON.stringify(metadata),
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertArtists(sourceId: string, artistList: MusicArtist[]) {
    for (const artist of artistList) {
        await upsertArtist(sourceId, artist);
    }
}

/**
 * TRACKS
 */

export async function getTracksByAlbum(albumId: string) {
    const result = await db
        .select()
        .from(tracks)
        .where(eq(tracks.albumId, albumId));
    return result.map(track => enrichTrack(track));
}

export async function getTracksByPlaylist(playlistId: string) {
    const relations = await db
        .select()
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, playlistId));
    
    if (relations.length === 0) return [];

    const trackIds = relations.map(r => r.trackId);
    const result = await db
        .select()
        .from(tracks)
        .where(inArray(tracks.id, trackIds));
    
    // Sort by position in playlist
    const trackMap = new Map(result.map(t => [t.id, t]));
    return relations
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(r => trackMap.get(r.trackId))
        .filter(Boolean)
        .map(track => enrichTrack(track!));
}

export async function getTrack(id: string) {
    const result = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
    if (!result[0]) return undefined;
    return enrichTrack(result[0]);
}

export async function upsertTrack(sourceId: string, track: AlbumTrack) {
    const now = Date.now();
    const metadata = extractTrackMetadata(track);

    await db.insert(tracks).values({
        sourceId,
        id: track.Id,
        name: track.Name,
        albumId: track.AlbumId || null,
        album: track.Album || null,
        albumArtist: track.AlbumArtist || null,
        productionYear: track.ProductionYear || null,
        indexNumber: track.IndexNumber || null,
        parentIndexNumber: track.ParentIndexNumber || null,
        hasLyrics: track.HasLyrics || false,
        runTimeTicks: track.RunTimeTicks || null,
        lyrics: track.Lyrics ? JSON.stringify(track.Lyrics) : null,
        metadataJson: JSON.stringify(metadata),
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: tracks.id,
        set: {
            name: track.Name,
            album: track.Album || null,
            albumArtist: track.AlbumArtist || null,
            hasLyrics: track.HasLyrics || false,
            lyrics: track.Lyrics ? JSON.stringify(track.Lyrics) : null,
            metadataJson: JSON.stringify(metadata),
            updatedAt: now,
        },
    });

    // Update track-artist relations
    await updateTrackArtists(sourceId, track.Id, track.ArtistItems);

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertTracks(sourceId: string, trackList: AlbumTrack[]) {
    for (const track of trackList) {
        await upsertTrack(sourceId, track);
    }
}

export async function updateTrackCodec(trackId: string, codec: any) {
    const track = await getTrack(trackId);
    if (!track) return;

    const metadata = track.metadataJson ? JSON.parse(track.metadataJson) : {};
    metadata.Codec = codec;

    await db.update(tracks)
        .set({
            metadataJson: JSON.stringify(metadata),
            updatedAt: Date.now(),
        })
        .where(eq(tracks.id, trackId));

    sqliteDb.flushPendingReactiveQueries();
}

/**
 * PLAYLISTS
 */

export async function getAllPlaylists() {
    const result = await db.select().from(playlists);
    return result.map(playlist => enrichPlaylist(playlist));
}

export async function getPlaylist(id: string) {
    const result = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
    if (!result[0]) return undefined;
    return enrichPlaylist(result[0]);
}

export async function upsertPlaylist(sourceId: string, playlist: Playlist) {
    const now = Date.now();
    const metadata = extractPlaylistMetadata(playlist);

    await db.insert(playlists).values({
        sourceId,
        id: playlist.Id,
        name: playlist.Name,
        canDelete: playlist.CanDelete,
        childCount: playlist.ChildCount || null,
        lastRefreshed: now,
        metadataJson: JSON.stringify(metadata),
        createdAt: now,
        updatedAt: now,
    }).onConflictDoUpdate({
        target: playlists.id,
        set: {
            name: playlist.Name,
            canDelete: playlist.CanDelete,
            childCount: playlist.ChildCount || null,
            lastRefreshed: now,
            metadataJson: JSON.stringify(metadata),
            updatedAt: now,
        },
    });

    sqliteDb.flushPendingReactiveQueries();
}

export async function upsertPlaylists(sourceId: string, playlistList: Playlist[]) {
    for (const playlist of playlistList) {
        await upsertPlaylist(sourceId, playlist);
    }
}

export async function setPlaylistTracks(sourceId: string, playlistId: string, trackIds: string[]) {
    // Delete existing relations
    await db.delete(playlistTracks).where(
        and(
            eq(playlistTracks.sourceId, sourceId),
            eq(playlistTracks.playlistId, playlistId)
        )
    );

    // Insert new relations with positions
    if (trackIds.length > 0) {
        await db.insert(playlistTracks).values(
            trackIds.map((trackId, index) => ({
                sourceId,
                playlistId,
                trackId,
                position: index,
            }))
        );
    }

    sqliteDb.flushPendingReactiveQueries();
}

/**
 * HELPER FUNCTIONS
 */

async function updateAlbumArtists(sourceId: string, albumId: string, albumArtistsList: any[]) {
    // Delete existing relations
    await db.delete(albumArtists).where(
        and(
            eq(albumArtists.sourceId, sourceId),
            eq(albumArtists.albumId, albumId)
        )
    );

    // Insert new relations
    if (albumArtistsList && albumArtistsList.length > 0) {
        await db.insert(albumArtists).values(
            albumArtistsList.map((artist, index) => ({
                sourceId,
                albumId,
                artistId: artist.Id,
                orderIndex: index,
            }))
        );
    }
}

async function updateTrackArtists(sourceId: string, trackId: string, artistItems: any[]) {
    // Delete existing relations
    await db.delete(trackArtists).where(
        and(
            eq(trackArtists.sourceId, sourceId),
            eq(trackArtists.trackId, trackId)
        )
    );

    // Insert new relations
    if (artistItems && artistItems.length > 0) {
        await db.insert(trackArtists).values(
            artistItems.map((artist, index) => ({
                sourceId,
                trackId,
                artistId: artist.Id,
                orderIndex: index,
            }))
        );
    }
}

function extractAlbumMetadata(album: Album) {
    return {
        ServerId: album.ServerId,
        SortName: album.SortName,
        RunTimeTicks: album.RunTimeTicks,
        Type: album.Type,
        UserData: album.UserData,
        PrimaryImageAspectRatio: album.PrimaryImageAspectRatio,
        Artists: album.Artists,
        ArtistItems: album.ArtistItems,
        AlbumArtists: album.AlbumArtists,
        ImageTags: album.ImageTags,
        BackdropImageTags: album.BackdropImageTags,
        LocationType: album.LocationType,
        Overview: album.Overview,
        PrimaryImageItemId: album.PrimaryImageItemId,
    };
}

function enrichAlbum(dbAlbum: any): Album {
    const metadata = dbAlbum.metadataJson ? JSON.parse(dbAlbum.metadataJson) : {};
    return {
        Id: dbAlbum.id,
        Name: dbAlbum.name,
        ProductionYear: dbAlbum.productionYear,
        IsFolder: dbAlbum.isFolder,
        AlbumArtist: dbAlbum.albumArtist,
        DateCreated: dbAlbum.dateCreated ? new Date(dbAlbum.dateCreated).toISOString() : new Date().toISOString(),
        lastRefreshed: dbAlbum.lastRefreshed,
        ...metadata,
    };
}

function extractArtistMetadata(artist: MusicArtist) {
    return {
        ServerId: artist.ServerId,
        ChannelId: artist.ChannelId,
        RunTimeTicks: artist.RunTimeTicks,
        Type: artist.Type,
        UserData: artist.UserData,
        ImageTags: artist.ImageTags,
        BackdropImageTags: artist.BackdropImageTags,
        ImageBlurHashes: artist.ImageBlurHashes,
        LocationType: artist.LocationType,
        Overview: artist.Overview,
    };
}

function enrichArtist(dbArtist: any): MusicArtist {
    const metadata = dbArtist.metadataJson ? JSON.parse(dbArtist.metadataJson) : {};
    return {
        Id: dbArtist.id,
        Name: dbArtist.name,
        IsFolder: dbArtist.isFolder,
        ...metadata,
    };
}

function extractTrackMetadata(track: AlbumTrack) {
    return {
        ServerId: track.ServerId,
        Type: track.Type,
        UserData: track.UserData,
        Artists: track.Artists,
        ArtistItems: track.ArtistItems,
        AlbumPrimaryImageTag: track.AlbumPrimaryImageTag,
        AlbumArtists: track.AlbumArtists,
        ImageTags: track.ImageTags,
        BackdropImageTags: track.BackdropImageTags,
        LocationType: track.LocationType,
        MediaType: track.MediaType,
        MediaStreams: track.MediaStreams,
        Codec: track.Codec,
    };
}

function enrichTrack(dbTrack: any): AlbumTrack {
    const metadata = dbTrack.metadataJson ? JSON.parse(dbTrack.metadataJson) : {};
    const lyrics = dbTrack.lyrics ? JSON.parse(dbTrack.lyrics) : undefined;
    
    return {
        Id: dbTrack.id,
        Name: dbTrack.name,
        AlbumId: dbTrack.albumId,
        Album: dbTrack.album,
        AlbumArtist: dbTrack.albumArtist,
        ProductionYear: dbTrack.productionYear,
        IndexNumber: dbTrack.indexNumber,
        ParentIndexNumber: dbTrack.parentIndexNumber,
        HasLyrics: dbTrack.hasLyrics,
        RunTimeTicks: dbTrack.runTimeTicks,
        Lyrics: lyrics,
        ...metadata,
    };
}

function extractPlaylistMetadata(playlist: Playlist) {
    return {
        ServerId: playlist.ServerId,
        SortName: playlist.SortName,
        ChannelId: playlist.ChannelId,
        RunTimeTicks: playlist.RunTimeTicks,
        Type: playlist.Type,
        UserData: playlist.UserData,
        PrimaryImageAspectRatio: playlist.PrimaryImageAspectRatio,
        ImageTags: playlist.ImageTags,
        BackdropImageTags: playlist.BackdropImageTags,
        LocationType: playlist.LocationType,
        MediaType: playlist.MediaType,
    };
}

function enrichPlaylist(dbPlaylist: any): Playlist {
    const metadata = dbPlaylist.metadataJson ? JSON.parse(dbPlaylist.metadataJson) : {};
    return {
        Id: dbPlaylist.id,
        Name: dbPlaylist.name,
        CanDelete: dbPlaylist.canDelete,
        ChildCount: dbPlaylist.childCount,
        lastRefreshed: dbPlaylist.lastRefreshed,
        ...metadata,
    };
}
