import type { CardReview } from "@/lib/db/schema";
import type { ReviewGrade } from "@/types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MIN_EASE_FACTOR = 1.3;
const INITIAL_INTERVAL = 1;
const SECOND_INTERVAL = 6;

function getEaseFactorDelta(grade: ReviewGrade): number {
  return 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
}

function assertReviewGrade(grade: number): asserts grade is ReviewGrade {
  if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
    throw new Error("Invalid review grade.");
  }
}

function calculateInterval(card: CardReview, grade: ReviewGrade): number {
  if (grade < 3) {
    return INITIAL_INTERVAL;
  }

  if (card.repetition <= 0) {
    return INITIAL_INTERVAL;
  }

  if (card.repetition === 1) {
    return SECOND_INTERVAL;
  }

  return Math.max(INITIAL_INTERVAL, Math.round(card.interval * card.easeFactor));
}

function calculateNextReviewAt(
  card: CardReview,
  grade: ReviewGrade,
  reviewedAt: number,
): CardReview {
  const nextEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    card.easeFactor + getEaseFactorDelta(grade),
  );
  const nextInterval = calculateInterval(card, grade);
  const nextRepetition = grade < 3 ? 0 : card.repetition + 1;

  return {
    ...card,
    easeFactor: nextEaseFactor,
    interval: nextInterval,
    repetition: nextRepetition,
    lastReview: reviewedAt,
    nextReview: reviewedAt + nextInterval * DAY_IN_MS,
  };
}

export function calculateNextReview(
  card: CardReview,
  grade: ReviewGrade,
): CardReview {
  assertReviewGrade(grade);

  return calculateNextReviewAt(card, grade, Date.now());
}
