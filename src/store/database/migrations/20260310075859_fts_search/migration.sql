-- FTS5 virtual tables (external content, no data duplication)
-- unicode61 tokenizer handles accented characters and case-folding automatically

CREATE VIRTUAL TABLE albums_fts USING fts5(
    id UNINDEXED,
    name,
    album_artist,
    content='albums',
    content_rowid='rowid',
    tokenize='unicode61'
);

CREATE VIRTUAL TABLE tracks_fts USING fts5(
    id UNINDEXED,
    name,
    album,
    album_artist,
    content='tracks',
    content_rowid='rowid',
    tokenize='unicode61'
);

CREATE VIRTUAL TABLE artists_fts USING fts5(
    id UNINDEXED,
    name,
    content='artists',
    content_rowid='rowid',
    tokenize='unicode61'
);

CREATE VIRTUAL TABLE playlists_fts USING fts5(
    id UNINDEXED,
    name,
    content='playlists',
    content_rowid='rowid',
    tokenize='unicode61'
);

--> statement-breakpoint

-- Sync triggers: albums

CREATE TRIGGER albums_fts_ai AFTER INSERT ON albums BEGIN
    INSERT INTO albums_fts(rowid, id, name, album_artist)
    VALUES (new.rowid, new.id, new.name, new.album_artist);
END;

CREATE TRIGGER albums_fts_ad AFTER DELETE ON albums BEGIN
    INSERT INTO albums_fts(albums_fts, rowid, id, name, album_artist)
    VALUES ('delete', old.rowid, old.id, old.name, old.album_artist);
END;

CREATE TRIGGER albums_fts_au AFTER UPDATE ON albums BEGIN
    INSERT INTO albums_fts(albums_fts, rowid, id, name, album_artist)
    VALUES ('delete', old.rowid, old.id, old.name, old.album_artist);
    INSERT INTO albums_fts(rowid, id, name, album_artist)
    VALUES (new.rowid, new.id, new.name, new.album_artist);
END;

--> statement-breakpoint

-- Sync triggers: tracks

CREATE TRIGGER tracks_fts_ai AFTER INSERT ON tracks BEGIN
    INSERT INTO tracks_fts(rowid, id, name, album, album_artist)
    VALUES (new.rowid, new.id, new.name, new.album, new.album_artist);
END;

CREATE TRIGGER tracks_fts_ad AFTER DELETE ON tracks BEGIN
    INSERT INTO tracks_fts(tracks_fts, rowid, id, name, album, album_artist)
    VALUES ('delete', old.rowid, old.id, old.name, old.album, old.album_artist);
END;

CREATE TRIGGER tracks_fts_au AFTER UPDATE ON tracks BEGIN
    INSERT INTO tracks_fts(tracks_fts, rowid, id, name, album, album_artist)
    VALUES ('delete', old.rowid, old.id, old.name, old.album, old.album_artist);
    INSERT INTO tracks_fts(rowid, id, name, album, album_artist)
    VALUES (new.rowid, new.id, new.name, new.album, new.album_artist);
END;

--> statement-breakpoint

-- Sync triggers: artists

CREATE TRIGGER artists_fts_ai AFTER INSERT ON artists BEGIN
    INSERT INTO artists_fts(rowid, id, name)
    VALUES (new.rowid, new.id, new.name);
END;

CREATE TRIGGER artists_fts_ad AFTER DELETE ON artists BEGIN
    INSERT INTO artists_fts(artists_fts, rowid, id, name)
    VALUES ('delete', old.rowid, old.id, old.name);
END;

CREATE TRIGGER artists_fts_au AFTER UPDATE ON artists BEGIN
    INSERT INTO artists_fts(artists_fts, rowid, id, name)
    VALUES ('delete', old.rowid, old.id, old.name);
    INSERT INTO artists_fts(rowid, id, name)
    VALUES (new.rowid, new.id, new.name);
END;

--> statement-breakpoint

-- Sync triggers: playlists

CREATE TRIGGER playlists_fts_ai AFTER INSERT ON playlists BEGIN
    INSERT INTO playlists_fts(rowid, id, name)
    VALUES (new.rowid, new.id, new.name);
END;

CREATE TRIGGER playlists_fts_ad AFTER DELETE ON playlists BEGIN
    INSERT INTO playlists_fts(playlists_fts, rowid, id, name)
    VALUES ('delete', old.rowid, old.id, old.name);
END;

CREATE TRIGGER playlists_fts_au AFTER UPDATE ON playlists BEGIN
    INSERT INTO playlists_fts(playlists_fts, rowid, id, name)
    VALUES ('delete', old.rowid, old.id, old.name);
    INSERT INTO playlists_fts(rowid, id, name)
    VALUES (new.rowid, new.id, new.name);
END;

--> statement-breakpoint

-- Backfill existing data

INSERT INTO albums_fts(rowid, id, name, album_artist)
SELECT rowid, id, name, album_artist FROM albums;

INSERT INTO tracks_fts(rowid, id, name, album, album_artist)
SELECT rowid, id, name, album, album_artist FROM tracks;

INSERT INTO artists_fts(rowid, id, name)
SELECT rowid, id, name FROM artists;

INSERT INTO playlists_fts(rowid, id, name)
SELECT rowid, id, name FROM playlists;