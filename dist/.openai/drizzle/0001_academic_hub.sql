CREATE TABLE `academic_state` (
	`owner` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL DEFAULT '{"terms":[],"holidays":[],"subjects":[],"blocks":[],"exams":[]}',
	`revision` integer NOT NULL DEFAULT 0,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `academic_owner_updated` ON `academic_state` (`owner`,`updated`);
