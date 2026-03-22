import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { deleteCard, getCardByIdForUser, updateCard, updateDeck } from "@/lib/db/queries";

const cardIdSchema = z.string().uuid();

const updateCardRequestSchema = z
  .object({
    back: z.string().trim().min(1).max(4000).optional(),
    context: z
      .string()
      .trim()
      .max(500)
      .transform((value: string) => (value.length > 0 ? value : null))
      .optional(),
    front: z.string().trim().min(1).max(240).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field is required.",
  });

interface CardRouteContext {
  params: {
    id: string;
  };
}

function parseCardId(id: string): string | NextResponse {
  const parsed = cardIdSchema.safeParse(id);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid card id." }, { status: 400 });
  }

  return parsed.data;
}

export async function PATCH(
  request: Request,
  context: CardRouteContext,
): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsedCardId = parseCardId(context.params.id);

    if (parsedCardId instanceof NextResponse) {
      return parsedCardId;
    }

    const existingCard = await getCardByIdForUser(parsedCardId, user.id);

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const body = updateCardRequestSchema.parse(await request.json());
    const now = Date.now();
    const card = await updateCard(parsedCardId, {
      front: body.front,
      back: body.back,
      context: body.context,
    });

    await updateDeck(existingCard.deckId, {
      updatedAt: now,
    });

    return NextResponse.json({ card });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: CardRouteContext,
): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const parsedCardId = parseCardId(context.params.id);

    if (parsedCardId instanceof NextResponse) {
      return parsedCardId;
    }

    const existingCard = await getCardByIdForUser(parsedCardId, user.id);

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    await deleteCard(parsedCardId);
    await updateDeck(existingCard.deckId, {
      updatedAt: Date.now(),
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
