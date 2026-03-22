import { notFound } from "next/navigation";
import { z } from "zod";
import { StudySession } from "@/components/study";
import { requireServerSession } from "@/lib/auth/server-session";
import { getDeckWithStatsByIdForUser } from "@/lib/db/queries";
import { getCardsDueToday, getNextScheduledReviewAt } from "@/lib/db/reviews";
import type { CardRecord } from "@/types";

const studyPageParamsSchema = z.object({
  id: z.string().uuid(),
});

interface DeckStudyPageProps {
  params: {
    id: string;
  };
}

export default async function DeckStudyPage({
  params,
}: DeckStudyPageProps): Promise<JSX.Element> {
  const parsedParams = studyPageParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    notFound();
  }

  const session = await requireServerSession();
  const deck = await getDeckWithStatsByIdForUser(parsedParams.data.id, session.user.id);

  if (!deck) {
    notFound();
  }

  const [dueCards, nextReviewAt] = await Promise.all([
    getCardsDueToday(session.user.id, deck.id),
    getNextScheduledReviewAt(session.user.id, deck.id),
  ]);

  return (
    <StudySession
      deck={deck}
      initialCards={dueCards as CardRecord[]}
      initialNextReviewAt={nextReviewAt}
    />
  );
}
