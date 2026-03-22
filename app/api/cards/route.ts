import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { createInitialCardReview } from "@/lib/db/reviews";
import { db } from "@/lib/db";
import {
  createCard,
  getDeckByIdForUser,
  listCardsByDeckId,
  updateDeck,
} from "@/lib/db/queries";
import { cardReviews, cards, decks } from "@/lib/db/schema";
import { cardSourceTypeValues } from "@/types";

const deckIdSchema = z.string().uuid();

const createCardInputSchema = z.object({
  back: z.string().trim().min(1).max(4000),
  context: z
    .string()
    .trim()
    .max(500)
    .transform((value: string) => (value.length > 0 ? value : null))
    .optional(),
  deckId: deckIdSchema,
  front: z.string().trim().min(1).max(240),
  sourceType: z.enum(cardSourceTypeValues).optional().default("manual"),
});

const createCardsBatchItemSchema = z.object({
  back: z.string().trim().min(1).max(4000),
  context: z
    .string()
    .trim()
    .max(500)
    .transform((value: string) => (value.length > 0 ? value : null))
    .optional(),
  front: z.string().trim().min(1).max(240),
});

const createCardsBatchRequestSchema = z.object({
  cards: z.array(createCardsBatchItemSchema).min(1).max(50),
  deckId: deckIdSchema,
  sourceType: z.enum(cardSourceTypeValues),
});

const createCardRequestSchema = z.union([
  createCardInputSchema,
  createCardsBatchRequestSchema,
]);

function parseDeckId(value: string | null): string | NextResponse {
  const parsed = deckIdSchema.safeParse(value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deck id." }, { status: 400 });
  }

  return parsed.data;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const parsedDeckId = parseDeckId(url.searchParams.get("deckId"));

    if (parsedDeckId instanceof NextResponse) {
      return parsedDeckId;
    }

    const deck = await getDeckByIdForUser(parsedDeckId, user.id);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    const cards = await listCardsByDeckId(parsedDeckId);

    return NextResponse.json({ cards });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = createCardRequestSchema.parse(await request.json());
    const deck = await getDeckByIdForUser(body.deckId, user.id);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    const now = Date.now();

    if ("cards" in body) {
      const cardRows = body.cards.map((card) => ({
        id: crypto.randomUUID(),
        deckId: body.deckId,
        front: card.front,
        back: card.back,
        context: card.context ?? null,
        sourceType: body.sourceType,
        createdAt: now,
      }));
      const reviewRows = cardRows.map((card) => ({
        id: crypto.randomUUID(),
        cardId: card.id,
        userId: user.id,
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        nextReview: now,
        lastReview: null,
      }));

      await db.transaction(async (tx) => {
        await tx.insert(cards).values(cardRows);
        await tx.insert(cardReviews).values(reviewRows);
        await tx.update(decks).set({ updatedAt: now }).where(eq(decks.id, body.deckId));
      });

      return NextResponse.json(
        {
          cards: cardRows,
          count: cardRows.length,
        },
        { status: 201 },
      );
    }

    const card = await createCard({
      id: crypto.randomUUID(),
      deckId: body.deckId,
      front: body.front,
      back: body.back,
      context: body.context ?? null,
      sourceType: body.sourceType,
      createdAt: now,
    });
    await createInitialCardReview(card.id, user.id, now);

    await updateDeck(body.deckId, {
      updatedAt: now,
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
