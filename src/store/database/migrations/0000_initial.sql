CREATE TABLE `albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`artist_id` integer NOT NULL,
	`artist` text NOT NULL,
	`year` integer,
	`image_url` text,
	`jellyfin_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `albums_jellyfin_id_unique` ON `albums` (`jellyfin_id`);--> statement-breakpoint
CREATE INDEX `albums_artist_id_idx` ON `albums` (`artist_id`);--> statement-breakpoint
CREATE INDEX `albums_name_idx` ON `albums` (`name`);--> statement-breakpoint
CREATE INDEX `albums_year_idx` ON `albums` (`year`);--> statement-breakpoint
CREATE TABLE `artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`jellyfin_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_jellyfin_id_unique` ON `artists` (`jellyfin_id`);--> statement-breakpoint
CREATE INDEX `artists_name_idx` ON `artists` (`name`);--> statement-breakpoint
CREATE TABLE `playlist_tracks` (
	`playlist_id` integer NOT NULL,
	`track_id` integer NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`playlist_id`, `position`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlist_tracks_playlist_id_idx` ON `playlist_tracks` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `playlist_tracks_track_id_idx` ON `playlist_tracks` (`track_id`);--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`jellyfin_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playlists_jellyfin_id_unique` ON `playlists` (`jellyfin_id`);--> statement-breakpoint
CREATE INDEX `playlists_name_idx` ON `playlists` (`name`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`album_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`duration` integer NOT NULL,
	`track_number` integer,
	`jellyfin_id` text NOT NULL,
	`file_path` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracks_jellyfin_id_unique` ON `tracks` (`jellyfin_id`);--> statement-breakpoint
CREATE INDEX `tracks_album_id_idx` ON `tracks` (`album_id`);--> statement-breakpoint
CREATE INDEX `tracks_artist_id_idx` ON `tracks` (`artist_id`);--> statement-breakpoint
CREATE INDEX `tracks_name_idx` ON `tracks` (`name`);--> statement-breakpoint
CREATE INDEX `tracks_track_number_idx` ON `tracks` (`track_number`);