import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { createDeck, listDecksWithStatsByUserId } from "@/lib/db/queries";
import { deckColorValues } from "@/types";

const deckColorSchema = z.enum(deckColorValues);

const createDeckRequestSchema = z.object({
  color: deckColorSchema.optional(),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((value: string) => (value.length > 0 ? value : null))
    .optional(),
  name: z.string().trim().min(1).max(80),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userDecks = await listDecksWithStatsByUserId(user.id);

    return NextResponse.json({ decks: userDecks });
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

    const body = createDeckRequestSchema.parse(await request.json());
    const now = Date.now();
    const deck = await createDeck({
      id: crypto.randomUUID(),
      userId: user.id,
      name: body.name,
      description: body.description ?? null,
      color: body.color ?? deckColorValues[0],
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        deck: {
          ...deck,
          cardCount: 0,
          dueTodayCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
