import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import {
  deleteDeck,
  getDeckByIdForUser,
  getDeckWithStatsByIdForUser,
  updateDeck,
} from "@/lib/db/queries";
import { deckColorValues } from "@/types";

const deckIdSchema = z.string().uuid();
const deckColorSchema = z.enum(deckColorValues);

const updateDeckRequestSchema = z
  .object({
    color: deckColorSchema.optional(),
    description: z
      .string()
      .trim()
      .max(500)
      .transform((value: string) => (value.length > 0 ? value : null))
      .optional(),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field is required.",
  });

interface DeckRouteContext {
  params: {
    id: string;
  };
}

function parseDeckId(id: string): string | NextResponse {
  const parsed = deckIdSchema.safeParse(id);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deck id." }, { status: 400 });
  }

  return parsed.data;
}

export async function GET(
  request: Request,
  context: DeckRouteContext,
): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsedDeckId = parseDeckId(context.params.id);

    if (parsedDeckId instanceof NextResponse) {
      return parsedDeckId;
    }

    const deck = await getDeckWithStatsByIdForUser(parsedDeckId, user.id);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    return NextResponse.json({ deck });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: DeckRouteContext,
): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsedDeckId = parseDeckId(context.params.id);

    if (parsedDeckId instanceof NextResponse) {
      return parsedDeckId;
    }

    const existingDeck = await getDeckByIdForUser(parsedDeckId, user.id);

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    const body = updateDeckRequestSchema.parse(await request.json());
    await updateDeck(parsedDeckId, {
      name: body.name,
      description: body.description,
      color: body.color,
      updatedAt: Date.now(),
    });

    const deck = await getDeckWithStatsByIdForUser(parsedDeckId, user.id);

    return NextResponse.json({ deck });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: DeckRouteContext,
): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsedDeckId = parseDeckId(context.params.id);

    if (parsedDeckId instanceof NextResponse) {
      return parsedDeckId;
    }

    const existingDeck = await getDeckByIdForUser(parsedDeckId, user.id);

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    await deleteDeck(parsedDeckId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
