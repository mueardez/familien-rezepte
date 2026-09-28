CREATE TABLE `imported_recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`owner_email` text NOT NULL,
	`title` text NOT NULL,
	`language` text DEFAULT 'de' NOT NULL,
	`time` text DEFAULT '30 Min.' NOT NULL,
	`method` text DEFAULT 'Andere' NOT NULL,
	`servings` text DEFAULT '3 Portionen' NOT NULL,
	`ingredients_json` text NOT NULL,
	`steps_json` text NOT NULL,
	`image_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_imported_recipes_slug` ON `imported_recipes` (`slug`);