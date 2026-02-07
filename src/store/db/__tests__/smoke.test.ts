/**
 * Database Smoke Tests
 * 
 * Basic tests to verify database functionality
 */

import { initializeDatabase, closeDatabase } from '../client';
import {
  upsertSource,
  upsertArtist,
  upsertAlbum,
  upsertTrack,
  upsertPlaylist,
  getSyncCursor,
  upsertSyncCursor,
} from '../helpers';
import { SourceType } from '@/store/sources/types';

describe('Database Smoke Tests', () => {
  beforeAll(() => {
    // Initialize database before tests
    initializeDatabase();
  });

  afterAll(() => {
    // Close database after tests
    closeDatabase();
  });

  it('should initialize database successfully', () => {
    expect(() => initializeDatabase()).not.toThrow();
  });

  it('should upsert a source', async () => {
    const source = {
      id: 'test-source-1',
      uri: 'https://test.jellyfin.server',
      userId: 'user-123',
      accessToken: 'token-abc',
      deviceId: 'device-xyz',
      type: SourceType.JELLYFIN_V1,
    };

    await expect(upsertSource(source)).resolves.not.toThrow();
  });

  it('should upsert an artist', async () => {
    const artist = {
      sourceId: 'test-source-1',
      id: 'artist-1',
      name: 'Test Artist',
      isFolder: false,
    };

    await expect(upsertArtist(artist)).resolves.not.toThrow();
  });

  it('should upsert an album', async () => {
    const album = {
      sourceId: 'test-source-1',
      id: 'album-1',
      name: 'Test Album',
      productionYear: 2023,
      isFolder: false,
      albumArtist: 'Test Artist',
    };

    await expect(upsertAlbum(album)).resolves.not.toThrow();
  });

  it('should upsert a track', async () => {
    const track = {
      sourceId: 'test-source-1',
      id: 'track-1',
      name: 'Test Track',
      albumId: 'album-1',
      album: 'Test Album',
      albumArtist: 'Test Artist',
      indexNumber: 1,
      runTimeTicks: 1800000000,
    };

    await expect(upsertTrack(track)).resolves.not.toThrow();
  });

  it('should upsert a playlist', async () => {
    const playlist = {
      sourceId: 'test-source-1',
      id: 'playlist-1',
      name: 'Test Playlist',
      canDelete: true,
      childCount: 10,
    };

    await expect(upsertPlaylist(playlist)).resolves.not.toThrow();
  });

  it('should handle sync cursors', async () => {
    const cursor = {
      sourceId: 'test-source-1',
      entityType: 'artists',
      startIndex: 0,
      pageSize: 500,
      completed: false,
    };

    // Upsert cursor
    await upsertSyncCursor(cursor);

    // Retrieve cursor
    const retrieved = await getSyncCursor('test-source-1', 'artists');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.startIndex).toBe(0);
    expect(retrieved?.completed).toBe(false);

    // Update cursor
    await upsertSyncCursor({
      ...cursor,
      startIndex: 500,
      completed: true,
    });

    // Retrieve updated cursor
    const updated = await getSyncCursor('test-source-1', 'artists');
    expect(updated?.startIndex).toBe(500);
    expect(updated?.completed).toBe(true);
  });
});
