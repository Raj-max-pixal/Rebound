CREATE TABLE `focus_members` (
	`room` text NOT NULL,
	`owner` text NOT NULL,
	`last_seen` integer NOT NULL,
	PRIMARY KEY(`room`, `owner`)
);
--> statement-breakpoint
CREATE INDEX `members_room` ON `focus_members` (`room`);--> statement-breakpoint
CREATE TABLE `focus_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`alias` text DEFAULT 'Quiet Learner' NOT NULL,
	`exam` text DEFAULT 'General' NOT NULL,
	`public` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `focus_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `focus_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`subject` text NOT NULL,
	`mode` text NOT NULL,
	`started` integer NOT NULL,
	`ended` integer,
	`seconds` integer DEFAULT 0 NOT NULL,
	`planned` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`interruptions` integer DEFAULT 0 NOT NULL,
	`room` text
);
--> statement-breakpoint
CREATE INDEX `sessions_owner_started` ON `focus_sessions` (`owner`,`started`);