CREATE TABLE `catalog_products` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`category` text NOT NULL,
	`tag` text NOT NULL,
	`price` real NOT NULL,
	`unit` text NOT NULL,
	`image` text NOT NULL,
	`image_position` text DEFAULT 'center' NOT NULL,
	`color` text NOT NULL,
	`rating` real DEFAULT 5 NOT NULL,
	`reviews` integer DEFAULT 0 NOT NULL,
	`description` text NOT NULL,
	`details` text NOT NULL,
	`features_json` text DEFAULT '[]' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
