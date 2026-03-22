import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { getDeckByIdForUser } from "@/lib/db/queries";
import { getCardsDueToday, getNextScheduledReviewAt } from "@/lib/db/reviews";

const dueCardsQuerySchema = z.object({
  deckId: z.string().uuid().optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = dueCardsQuerySchema.parse({
      deckId: url.searchParams.get("deckId") ?? undefined,
    });

    if (query.deckId) {
      const deck = await getDeckByIdForUser(query.deckId, user.id);

      if (!deck) {
        return NextResponse.json({ error: "Deck not found." }, { status: 404 });
      }
    }

    const cards = await getCardsDueToday(user.id, query.deckId);
    const nextReviewAt = await getNextScheduledReviewAt(user.id, query.deckId);

    return NextResponse.json({
      cards,
      count: cards.length,
      nextReviewAt,
    });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
