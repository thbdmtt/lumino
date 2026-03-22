import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  GenerateRouteError,
  aiLanguageValues,
  extractTextFromPdfBase64,
  generateCardsFromSource,
} from "@/lib/ai/generate";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { db } from "@/lib/db";
import { getDeckByIdForUser, getUserById } from "@/lib/db/queries";
import { cardReviews, cards, decks } from "@/lib/db/schema";
import { decryptSecret } from "@/lib/security";
import type { CardSourceType } from "@/types";

export const runtime = "nodejs";

const deckIdSchema = z.string().uuid();

const generateRequestSchema = z.discriminatedUnion("sourceType", [
  z.object({
    cardCount: z.number().int().min(5).max(50),
    content: z.string().trim().min(1).max(15000),
    deckId: deckIdSchema,
    language: z.enum(aiLanguageValues),
    persist: z.boolean().optional().default(true),
    sourceType: z.literal("text"),
  }),
  z.object({
    cardCount: z.number().int().min(5).max(50),
    deckId: deckIdSchema,
    language: z.enum(aiLanguageValues),
    pdfBase64: z.string().trim().min(1),
    persist: z.boolean().optional().default(true),
    sourceType: z.literal("pdf"),
  }),
]);

const reviewDefaults = {
  easeFactor: 2.5,
  interval: 1,
  repetition: 0,
} as const;

function getGeneratedSourceType(sourceType: "text" | "pdf"): CardSourceType {
  return sourceType === "pdf" ? "ai_pdf" : "ai_text";
}

function createGenerateErrorResponse(error: unknown): NextResponse {
  if (error instanceof GenerateRouteError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return createRouteErrorResponse(error);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = generateRequestSchema.parse(await request.json());
    const [deck, persistedUser] = await Promise.all([
      getDeckByIdForUser(body.deckId, user.id),
      getUserById(user.id),
    ]);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    const personalApiKey = persistedUser?.apiKey ? decryptSecret(persistedUser.apiKey) : null;

    const sourceText =
      body.sourceType === "pdf"
        ? await extractTextFromPdfBase64(body.pdfBase64)
        : body.content;

    const generatedCards = await generateCardsFromSource({
      apiKey: personalApiKey,
      cardCount: body.cardCount,
      language: body.language,
      sourceText,
    });

    if (!body.persist) {
      return NextResponse.json(
        {
          cards: generatedCards,
          count: generatedCards.length,
        },
        { status: 200 },
      );
    }

    const now = Date.now();
    const sourceType = getGeneratedSourceType(body.sourceType);
    const cardRows = generatedCards.map((card) => ({
      id: crypto.randomUUID(),
      deckId: body.deckId,
      front: card.front,
      back: card.back,
      context: card.context,
      sourceType,
      createdAt: now,
    }));
    const reviewRows = cardRows.map((card) => ({
      id: crypto.randomUUID(),
      cardId: card.id,
      userId: user.id,
      interval: reviewDefaults.interval,
      repetition: reviewDefaults.repetition,
      easeFactor: reviewDefaults.easeFactor,
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
        cards: cardRows.map((card) => ({
          id: card.id,
          front: card.front,
          back: card.back,
          context: card.context,
        })),
        count: cardRows.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return createGenerateErrorResponse(error);
  }
}
