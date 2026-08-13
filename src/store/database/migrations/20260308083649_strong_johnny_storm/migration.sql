CREATE TABLE `album_artists` (
	`source_id` text NOT NULL,
	`album_id` text NOT NULL,
	`artist_id` text NOT NULL,
	`order_index` integer,
	CONSTRAINT `album_artists_pk` PRIMARY KEY(`source_id`, `album_id`, `artist_id`),
	CONSTRAINT `fk_album_artists_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `album_similar` (
	`source_id` text NOT NULL,
	`album_id` text NOT NULL,
	`similar_album_id` text NOT NULL,
	CONSTRAINT `album_similar_pk` PRIMARY KEY(`source_id`, `album_id`, `similar_album_id`),
	CONSTRAINT `fk_album_similar_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `albums` (
	`source_id` text NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`production_year` integer,
	`album_artist` text,
	`metadata` text,
	`first_synced_at` integer NOT NULL,
	`last_synced_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	CONSTRAINT `fk_albums_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`source_id` text NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`metadata` text,
	`first_synced_at` integer NOT NULL,
	`last_synced_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	CONSTRAINT `fk_artists_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `downloads` (
	`source_id` text NOT NULL,
	`id` text PRIMARY KEY,
	`hash` text,
	`filename` text,
	`artwork_path` text,
	`mimetype` text,
	`file_size` integer,
	`progress` integer,
	`is_failed` integer NOT NULL,
	`is_complete` integer NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_downloads_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `playlist_tracks` (
	`source_id` text NOT NULL,
	`playlist_id` text NOT NULL,
	`track_id` text NOT NULL,
	`position` integer,
	CONSTRAINT `playlist_tracks_pk` PRIMARY KEY(`source_id`, `playlist_id`, `track_id`),
	CONSTRAINT `fk_playlist_tracks_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`source_id` text NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`can_delete` integer NOT NULL,
	`child_count` integer,
	`metadata` text,
	`first_synced_at` integer NOT NULL,
	`last_synced_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	CONSTRAINT `fk_playlists_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `search_queries` (
	`source_id` text NOT NULL,
	`id` text PRIMARY KEY,
	`query` text NOT NULL,
	`local_playback_only` integer NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_search_queries_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY,
	`bitrate` integer NOT NULL,
	`is_onboarding_complete` integer NOT NULL,
	`has_received_error_reporting_alert` integer NOT NULL,
	`enable_playback_reporting` integer NOT NULL,
	`color_scheme` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sleep_timer` (
	`id` integer PRIMARY KEY,
	`date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY,
	`uri` text NOT NULL,
	`user_id` text,
	`access_token` text,
	`device_id` text,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_cursors` (
	`source_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`parent_entity_id` text DEFAULT '' NOT NULL,
	`parent_entity_type` text DEFAULT '' NOT NULL,
	`start_index` integer NOT NULL,
	`page_size` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`failed_at` integer,
	`last_error` text,
	`updated_at` integer NOT NULL,
	CONSTRAINT `sync_cursors_pk` PRIMARY KEY(`source_id`, `entity_type`, `parent_entity_id`),
	CONSTRAINT `fk_sync_cursors_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `track_artists` (
	`source_id` text NOT NULL,
	`track_id` text NOT NULL,
	`artist_id` text NOT NULL,
	`order_index` integer,
	CONSTRAINT `track_artists_pk` PRIMARY KEY(`source_id`, `track_id`, `artist_id`),
	CONSTRAINT `fk_track_artists_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`source_id` text NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`album_id` text,
	`album` text,
	`album_artist` text,
	`production_year` integer,
	`index_number` integer,
	`parent_index_number` integer,
	`run_time_ticks` integer,
	`lyrics` text,
	`metadata` text,
	`first_synced_at` integer NOT NULL,
	`last_synced_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	CONSTRAINT `fk_tracks_source_id_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `album_artists_source_artist_idx` ON `album_artists` (`source_id`,`artist_id`);--> statement-breakpoint
CREATE INDEX `albums_source_name_idx` ON `albums` (`source_id`,`name`);--> statement-breakpoint
CREATE INDEX `albums_source_year_idx` ON `albums` (`source_id`,`production_year`);--> statement-breakpoint
CREATE INDEX `artists_source_name_idx` ON `artists` (`source_id`,`name`);--> statement-breakpoint
CREATE INDEX `playlist_tracks_source_playlist_position_idx` ON `playlist_tracks` (`source_id`,`playlist_id`,`position`);--> statement-breakpoint
CREATE INDEX `playlists_source_name_idx` ON `playlists` (`source_id`,`name`);--> statement-breakpoint
CREATE INDEX `search_queries_source_timestamp_idx` ON `search_queries` (`source_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `track_artists_source_artist_idx` ON `track_artists` (`source_id`,`artist_id`);--> statement-breakpoint
CREATE INDEX `tracks_source_album_idx` ON `tracks` (`source_id`,`album_id`);--> statement-breakpoint
CREATE INDEX `tracks_source_name_idx` ON `tracks` (`source_id`,`name`);