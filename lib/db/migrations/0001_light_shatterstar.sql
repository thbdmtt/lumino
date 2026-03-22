CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`idToken` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_id_account_id_unique` ON `accounts` (`providerId`,`accountId`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
DROP INDEX "accounts_user_id_idx";--> statement-breakpoint
DROP INDEX "accounts_provider_id_account_id_unique";--> statement-breakpoint
DROP INDEX "card_reviews_card_id_idx";--> statement-breakpoint
DROP INDEX "card_reviews_user_id_idx";--> statement-breakpoint
DROP INDEX "card_reviews_card_id_user_id_unique";--> statement-breakpoint
DROP INDEX "cards_deck_id_idx";--> statement-breakpoint
DROP INDEX "decks_user_id_idx";--> statement-breakpoint
DROP INDEX "sessions_token_unique";--> statement-breakpoint
DROP INDEX "sessions_user_id_idx";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "verifications_identifier_idx";--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "passwordHash" TO "passwordHash" text;--> statement-breakpoint
CREATE INDEX `card_reviews_card_id_idx` ON `card_reviews` (`cardId`);--> statement-breakpoint
CREATE INDEX `card_reviews_user_id_idx` ON `card_reviews` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `card_reviews_card_id_user_id_unique` ON `card_reviews` (`cardId`,`userId`);--> statement-breakpoint
CREATE INDEX `cards_deck_id_idx` ON `cards` (`deckId`);--> statement-breakpoint
CREATE INDEX `decks_user_id_idx` ON `decks` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `users` ADD `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `image` text;--> statement-breakpoint
ALTER TABLE `users` ADD `updatedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `ipAddress` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `userAgent` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `updatedAt` integer NOT NULL;