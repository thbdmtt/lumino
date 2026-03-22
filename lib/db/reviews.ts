import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { calculateNextReview } from "@/lib/sm2";
import type { ReviewGrade } from "@/types";
import { db } from "./index";
import {
  cards,
  cardReviews,
  decks,
  type Card,
  type CardReview,
} from "./schema";
import {
  createCardReview,
  getCardByIdForUser,
  getCardReview,
  updateCardReview,
} from "./queries";

const INITIAL_INTERVAL = 1;
const INITIAL_REPETITION = 0;
const INITIAL_EASE_FACTOR = 2.5;

function assertReviewGrade(grade: number): asserts grade is ReviewGrade {
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
    throw new Error("Invalid review grade.");
  }
}

function buildInitialCardReview(cardId: string, userId: string, nextReview: number): CardReview {
  return {
    id: crypto.randomUUID(),
    cardId,
    userId,
    interval: INITIAL_INTERVAL,
    repetition: INITIAL_REPETITION,
    easeFactor: INITIAL_EASE_FACTOR,
    nextReview,
    lastReview: null,
  };
}

export async function createInitialCardReview(
  cardId: string,
  userId: string,
  nextReview = Date.now(),
): Promise<CardReview> {
  return createCardReview(buildInitialCardReview(cardId, userId, nextReview));
}

export async function getCardsDueToday(
  userId: string,
  deckId?: string,
): Promise<Card[]> {
  const now = Date.now();

  return db
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
    .leftJoin(
      cardReviews,
      and(eq(cardReviews.cardId, cards.id), eq(cardReviews.userId, userId)),
    )
    .where(
      and(
        eq(decks.userId, userId),
        deckId ? eq(decks.id, deckId) : undefined,
        sql<boolean>`
          ${cards.id} is not null
          and (${cardReviews.id} is null or ${cardReviews.nextReview} <= ${now})
        `,
      ),
    )
    .orderBy(
      asc(sql<number>`coalesce(${cardReviews.nextReview}, ${cards.createdAt})`),
      asc(cards.createdAt),
    );
}

export async function getNextScheduledReviewAt(
  userId: string,
  deckId?: string,
): Promise<number | null> {
  const now = Date.now();
  const rows = await db
    .select({
      nextReviewAt: sql<number | null>`min(${cardReviews.nextReview})`,
    })
    .from(cardReviews)
    .innerJoin(cards, eq(cardReviews.cardId, cards.id))
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cardReviews.userId, userId),
        eq(decks.userId, userId),
        deckId ? eq(decks.id, deckId) : undefined,
        sql<boolean>`${cardReviews.nextReview} > ${now}`,
      ),
    )
    .limit(1);

  const value = rows[0]?.nextReviewAt;

  return value === null || value === undefined ? null : Number(value);
}

function getStartOfDay(value: number): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export async function getStudyStreak(userId: string): Promise<number> {
  const rows = await db
    .select({
      lastReview: cardReviews.lastReview,
    })
    .from(cardReviews)
    .where(
      and(
        eq(cardReviews.userId, userId),
        sql<boolean>`${cardReviews.lastReview} is not null`,
      ),
    )
    .orderBy(desc(cardReviews.lastReview));

  const uniqueStudyDays = Array.from(
    new Set(
      rows
        .map((row) => row.lastReview)
        .filter((value): value is number => value !== null)
        .map((value) => getStartOfDay(value)),
    ),
  );

  if (uniqueStudyDays.length === 0) {
    return 0;
  }

  const today = getStartOfDay(Date.now());
  const yesterday = today - 24 * 60 * 60 * 1000;
  const firstStudyDay = uniqueStudyDays[0];

  if (firstStudyDay !== today && firstStudyDay !== yesterday) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueStudyDays.length; index += 1) {
    if (uniqueStudyDays[index - 1] - uniqueStudyDays[index] !== 24 * 60 * 60 * 1000) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export async function getTotalReviewCount(userId: string): Promise<number> {
  const rows = await db
    .select({
      totalReviewCount: sql<number>`
        coalesce(
          sum(
            case
              when ${cardReviews.lastReview} is null then 0
              when ${cardReviews.repetition} > 0 then ${cardReviews.repetition}
              else 1
            end
          ),
          0
        )
      `,
    })
    .from(cardReviews)
    .where(eq(cardReviews.userId, userId))
    .limit(1);

  return Number(rows[0]?.totalReviewCount ?? 0);
}

export async function saveReview(
  cardId: string,
  userId: string,
  grade: ReviewGrade,
): Promise<CardReview> {
  assertReviewGrade(grade);

  const card = await getCardByIdForUser(cardId, userId);

  if (!card) {
    throw new Error("Card not found.");
  }

  const existingReview = await getCardReview(cardId, userId);
  const currentReview =
    existingReview ?? buildInitialCardReview(cardId, userId, card.createdAt);
  const nextReview = calculateNextReview(currentReview, grade);

  if (!existingReview) {
    return createCardReview(nextReview);
  }

  const updatedReview = await updateCardReview(existingReview.id, {
    easeFactor: nextReview.easeFactor,
    interval: nextReview.interval,
    repetition: nextReview.repetition,
    lastReview: nextReview.lastReview,
    nextReview: nextReview.nextReview,
  });

  if (!updatedReview) {
    throw new Error("Review could not be updated.");
  }

  return updatedReview;
}
