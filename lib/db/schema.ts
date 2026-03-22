import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const cardSourceTypes = ["ai_text", "ai_pdf", "manual"] as const;

export type CardSourceType = (typeof cardSourceTypes)[number];

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    passwordHash: text("passwordHash"),
    apiKey: text("apiKey"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("sessions_token_unique").on(table.token),
    userIdIndex: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
    scope: text("scope"),
    idToken: text("idToken"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    userIdIndex: index("accounts_user_id_idx").on(table.userId),
    providerAccountUnique: uniqueIndex("accounts_provider_id_account_id_unique").on(
      table.providerId,
      table.accountId,
    ),
  }),
);

export const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    identifierIndex: index("verifications_identifier_idx").on(table.identifier),
  }),
);

export const decks = sqliteTable(
  "decks",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("#6366F1"),
    createdAt: integer("createdAt").notNull(),
    updatedAt: integer("updatedAt").notNull(),
  },
  (table) => ({
    userIdIndex: index("decks_user_id_idx").on(table.userId),
  }),
);

export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    deckId: text("deckId")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    context: text("context"),
    sourceType: text("sourceType", { enum: cardSourceTypes }).notNull(),
    createdAt: integer("createdAt").notNull(),
  },
  (table) => ({
    deckIdIndex: index("cards_deck_id_idx").on(table.deckId),
  }),
);

export const cardReviews = sqliteTable(
  "card_reviews",
  {
    id: text("id").primaryKey(),
    cardId: text("cardId")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    interval: integer("interval").notNull().default(1),
    repetition: integer("repetition").notNull().default(0),
    easeFactor: real("easeFactor").notNull().default(2.5),
    nextReview: integer("nextReview").notNull(),
    lastReview: integer("lastReview"),
  },
  (table) => ({
    cardIdIndex: index("card_reviews_card_id_idx").on(table.cardId),
    userIdIndex: index("card_reviews_user_id_idx").on(table.userId),
    cardUserUnique: uniqueIndex("card_reviews_card_id_user_id_unique").on(
      table.cardId,
      table.userId,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

export type CardReview = typeof cardReviews.$inferSelect;
export type NewCardReview = typeof cardReviews.$inferInsert;
