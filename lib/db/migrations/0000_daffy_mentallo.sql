CREATE TABLE `card_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`cardId` text NOT NULL,
	`userId` text NOT NULL,
	`interval` integer DEFAULT 1 NOT NULL,
	`repetition` integer DEFAULT 0 NOT NULL,
	`easeFactor` real DEFAULT 2.5 NOT NULL,
	`nextReview` integer NOT NULL,
	`lastReview` integer,
	FOREIGN KEY (`cardId`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `card_reviews_card_id_idx` ON `card_reviews` (`cardId`);--> statement-breakpoint
CREATE INDEX `card_reviews_user_id_idx` ON `card_reviews` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `card_reviews_card_id_user_id_unique` ON `card_reviews` (`cardId`,`userId`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`deckId` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`context` text,
	`sourceType` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`deckId`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cards_deck_id_idx` ON `cards` (`deckId`);--> statement-breakpoint
CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#6366F1' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `decks_user_id_idx` ON `decks` (`userId`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`apiKey` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);