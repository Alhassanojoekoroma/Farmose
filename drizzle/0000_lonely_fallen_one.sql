CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text NOT NULL,
	`area` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`payment_method` text NOT NULL,
	`items_json` text NOT NULL,
	`subtotal` real NOT NULL,
	`delivery_fee` real NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);