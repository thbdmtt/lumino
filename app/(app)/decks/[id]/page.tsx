import { notFound } from "next/navigation";
import { z } from "zod";
import { DeckDetailView } from "@/components/card";
import { requireServerSession } from "@/lib/auth/server-session";
import { getDeckWithStatsByIdForUser, listCardsByDeckId } from "@/lib/db/queries";
import type { CardRecord } from "@/types";

const deckPageParamsSchema = z.object({
  id: z.string().uuid(),
});

interface DeckDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DeckDetailPage({
  params,
}: DeckDetailPageProps): Promise<JSX.Element> {
  const parsedParams = deckPageParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    notFound();
  }

  const session = await requireServerSession();
  const deck = await getDeckWithStatsByIdForUser(parsedParams.data.id, session.user.id);

  if (!deck) {
    notFound();
  }

  const cards = (await listCardsByDeckId(deck.id)) as CardRecord[];

  return <DeckDetailView deck={deck} initialCards={cards} />;
}
