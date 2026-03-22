import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";
import type { DeckWithStats } from "@/types";
import { db } from "./index";
import {
  cards,
  cardReviews,
  decks,
  sessions,
  users,
  type Card,
  type CardReview,
  type Deck,
  type NewCard,
  type NewCardReview,
  type NewDeck,
  type NewSession,
  type NewUser,
  type Session,
  type User,
} from "./schema";

export interface UpdateUserInput {
  apiKey?: string | null;
  email?: string;
  passwordHash?: string;
}

export interface UpdateSessionInput {
  expiresAt?: Date;
  token?: string;
}

export interface UpdateDeckInput {
  color?: string;
  description?: string | null;
  name?: string;
  updatedAt?: number;
}

export interface UpdateCardInput {
  back?: string;
  context?: string | null;
  front?: string;
  sourceType?: NewCard["sourceType"];
}

export interface UpdateCardReviewInput {
  easeFactor?: number;
  interval?: number;
  lastReview?: number | null;
  nextReview?: number;
  repetition?: number;
}

function hasDefinedValues<T extends object>(values: T): boolean {
  return Object.values(values).some((value: unknown) => value !== undefined);
}

function parseCountValue(value: number | string | null): number {
  return Number(value ?? 0);
}

function dueTodayCountExpression(now: number) {
  return sql<number>`
    coalesce(
      sum(
        case
          when ${cards.id} is not null
            and (${cardReviews.id} is null or ${cardReviews.nextReview} <= ${now})
          then 1
          else 0
        end
      ),
      0
    )
  `;
}

export async function getUserById(id: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(values: NewUser): Promise<User> {
  const rows = await db.insert(users).values(values).returning();
  return rows[0];
}

export async function updateUser(id: string, values: UpdateUserInput): Promise<User | null> {
  if (!hasDefinedValues(values)) {
    return getUserById(id);
  }

  const rows = await db.update(users).set(values).where(eq(users.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

export async function getSessionById(id: string): Promise<Session | null> {
  const rows = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const rows = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function listSessionsByUserId(userId: string): Promise<Session[]> {
  return db.select().from(sessions).where(eq(sessions.userId, userId));
}

export async function createSession(values: NewSession): Promise<Session> {
  const rows = await db.insert(sessions).values(values).returning();
  return rows[0];
}

export async function updateSession(
  id: string,
  values: UpdateSessionInput,
): Promise<Session | null> {
  if (!hasDefinedValues(values)) {
    return getSessionById(id);
  }

  const rows = await db.update(sessions).set(values).where(eq(sessions.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteSession(id: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, id));
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function getDeckById(id: string): Promise<Deck | null> {
  const rows = await db.select().from(decks).where(eq(decks.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getDeckByIdForUser(id: string, userId: string): Promise<Deck | null> {
  const rows = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function listDecksByUserId(userId: string): Promise<Deck[]> {
  return db.select().from(decks).where(eq(decks.userId, userId));
}

export async function listDecksWithStatsByUserId(userId: string): Promise<DeckWithStats[]> {
  const now = Date.now();
  const rows = await db
    .select({
      id: decks.id,
      userId: decks.userId,
      name: decks.name,
      description: decks.description,
      color: decks.color,
      createdAt: decks.createdAt,
      updatedAt: decks.updatedAt,
      cardCount: count(cards.id),
      dueTodayCount: dueTodayCountExpression(now),
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .leftJoin(
      cardReviews,
      and(eq(cardReviews.cardId, cards.id), eq(cardReviews.userId, userId)),
    )
    .where(eq(decks.userId, userId))
    .groupBy(
      decks.id,
      decks.userId,
      decks.name,
      decks.description,
      decks.color,
      decks.createdAt,
      decks.updatedAt,
    )
    .orderBy(desc(decks.updatedAt));

  return rows.map((row) => ({
    ...row,
    cardCount: parseCountValue(row.cardCount),
    dueTodayCount: parseCountValue(row.dueTodayCount),
  }));
}

export async function getDeckWithStatsByIdForUser(
  id: string,
  userId: string,
): Promise<DeckWithStats | null> {
  const now = Date.now();
  const rows = await db
    .select({
      id: decks.id,
      userId: decks.userId,
      name: decks.name,
      description: decks.description,
      color: decks.color,
      createdAt: decks.createdAt,
      updatedAt: decks.updatedAt,
      cardCount: count(cards.id),
      dueTodayCount: dueTodayCountExpression(now),
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .leftJoin(
      cardReviews,
      and(eq(cardReviews.cardId, cards.id), eq(cardReviews.userId, userId)),
    )
    .where(and(eq(decks.id, id), eq(decks.userId, userId)))
    .groupBy(
      decks.id,
      decks.userId,
      decks.name,
      decks.description,
      decks.color,
      decks.createdAt,
      decks.updatedAt,
    )
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    ...row,
    cardCount: parseCountValue(row.cardCount),
    dueTodayCount: parseCountValue(row.dueTodayCount),
  };
}

export async function createDeck(values: NewDeck): Promise<Deck> {
  const rows = await db.insert(decks).values(values).returning();
  return rows[0];
}

export async function updateDeck(id: string, values: UpdateDeckInput): Promise<Deck | null> {
  if (!hasDefinedValues(values)) {
    return getDeckById(id);
  }

  const rows = await db.update(decks).set(values).where(eq(decks.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteDeck(id: string): Promise<void> {
  await db.delete(decks).where(eq(decks.id, id));
}

export async function getCardById(id: string): Promise<Card | null> {
  const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCardByIdForUser(id: string, userId: string): Promise<Card | null> {
  const rows = await db
    .select({
      id: cards.id,
      deckId: cards.deckId,
      front: cards.front,
      back: cards.back,
      context: cards.context,
      sourceType: cards.sourceType,
      createdAt: cards.createdAt,
    })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(and(eq(cards.id, id), eq(decks.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function listCardsByDeckId(deckId: string): Promise<Card[]> {
  return db.select().from(cards).where(eq(cards.deckId, deckId)).orderBy(desc(cards.createdAt));
}

export async function createCard(values: NewCard): Promise<Card> {
  const rows = await db.insert(cards).values(values).returning();
  return rows[0];
}

export async function updateCard(id: string, values: UpdateCardInput): Promise<Card | null> {
  if (!hasDefinedValues(values)) {
    return getCardById(id);
  }

  const rows = await db.update(cards).set(values).where(eq(cards.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteCard(id: string): Promise<void> {
  await db.delete(cards).where(eq(cards.id, id));
}

export async function getCardReviewById(id: string): Promise<CardReview | null> {
  const rows = await db.select().from(cardReviews).where(eq(cardReviews.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCardReview(
  cardId: string,
  userId: string,
): Promise<CardReview | null> {
  const rows = await db
    .select()
    .from(cardReviews)
    .where(and(eq(cardReviews.cardId, cardId), eq(cardReviews.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createCardReview(values: NewCardReview): Promise<CardReview> {
  const rows = await db.insert(cardReviews).values(values).returning();
  return rows[0];
}

export async function updateCardReview(
  id: string,
  values: UpdateCardReviewInput,
): Promise<CardReview | null> {
  if (!hasDefinedValues(values)) {
    return getCardReviewById(id);
  }

  const rows = await db
    .update(cardReviews)
    .set(values)
    .where(eq(cardReviews.id, id))
    .returning();

  return rows[0] ?? null;
}

export async function deleteCardReview(id: string): Promise<void> {
  await db.delete(cardReviews).where(eq(cardReviews.id, id));
}
