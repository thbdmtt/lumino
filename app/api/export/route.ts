import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedApiUser } from "@/lib/auth/api-session";
import { createRouteErrorResponse } from "@/lib/auth/route-utils";
import { getDeckByIdForUser, listCardsByDeckId } from "@/lib/db/queries";

const exportQuerySchema = z.object({
  deckId: z.string().uuid(),
  format: z.enum(["csv", "json"]),
});

function createDownloadSlug(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "deck";
}

function escapeCsvCell(value: string | null): string {
  return `"${(value ?? "").replace(/"/g, '""')}"`;
}

function buildContentDisposition(filename: string): string {
  return `attachment; filename="${filename}"`;
}

function createExportPayload(deck: {
  color: string;
  createdAt: number;
  description: string | null;
  id: string;
  name: string;
  updatedAt: number;
}, cards: Array<{ back: string; context: string | null; front: string }>) {
  return {
    deck,
    cards,
  };
}

function buildCsvContent(cards: Array<{ back: string; context: string | null; front: string }>): string {
  const rows = cards.map((card) =>
    [escapeCsvCell(card.front), escapeCsvCell(card.back), escapeCsvCell(card.context)].join(","),
  );

  return `\uFEFFfront,back,context\n${rows.join("\n")}`;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedApiUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = exportQuerySchema.parse({
      deckId: url.searchParams.get("deckId"),
      format: url.searchParams.get("format"),
    });

    const deck = await getDeckByIdForUser(query.deckId, user.id);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

    const cards = await listCardsByDeckId(deck.id);
    const exportCards = cards.map((card) => ({
      front: card.front,
      back: card.back,
      context: card.context,
    }));
    const exportPayload = createExportPayload(
      {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        color: deck.color,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      },
      exportCards,
    );
    const filename = `${createDownloadSlug(deck.name)}.${query.format}`;

    if (query.format === "json") {
      return new Response(JSON.stringify(exportPayload, null, 2), {
        status: 200,
        headers: {
          "content-disposition": buildContentDisposition(filename),
          "content-type": "application/json; charset=utf-8",
        },
      });
    }

    return new Response(buildCsvContent(exportCards), {
      status: 200,
      headers: {
        "content-disposition": buildContentDisposition(filename),
        "content-type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
