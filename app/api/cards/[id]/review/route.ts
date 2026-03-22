import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { getCardByIdForUser } from "@/lib/db/queries";
import { saveReview } from "@/lib/db/reviews";

const cardIdSchema = z.string().uuid();
const reviewBodySchema = z.object({
  grade: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

interface CardReviewRouteContext {
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

export async function POST(
  request: Request,
  context: CardReviewRouteContext,
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

    const card = await getCardByIdForUser(parsedCardId, user.id);

    if (!card) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const body = reviewBodySchema.parse(await request.json());
    const review = await saveReview(parsedCardId, user.id, body.grade);

    return NextResponse.json({ review });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
