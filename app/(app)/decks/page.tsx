import { DeckLibrary } from "@/components/deck";
import { requireServerSession } from "@/lib/auth/server-session";
import { listDecksWithStatsByUserId } from "@/lib/db/queries";

export default async function DecksPage(): Promise<JSX.Element> {
  const session = await requireServerSession();
  const decks = await listDecksWithStatsByUserId(session.user.id);

  return <DeckLibrary initialDecks={decks} />;
}
