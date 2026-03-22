import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const actionLinkClassName =
  "inline-flex min-h-[44px] items-center justify-center gap-sm rounded-full border px-md py-[10px] text-base font-semibold tracking-body transition-all duration-fast ease-spring";

export default function OfflinePage(): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center px-md py-2xl">
      <Card className="w-full max-w-2xl rounded-xl bg-app-canvas" glow>
        <div className="space-y-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-outline bg-surface-overlay text-warning">
            <WifiOff className="h-7 w-7" />
          </div>

          <div className="space-y-sm">
            <Badge variant="warning">Mode hors ligne</Badge>
            <h1 className="text-3xl tracking-title text-ink-primary sm:text-4xl">
              Lumino ne peut pas joindre le reseau pour le moment.
            </h1>
            <p className="mx-auto max-w-xl text-base text-ink-secondary">
              Reconnecte-toi pour recharger tes decks et tes cartes. Les assets
              PWA essentiels restent disponibles, mais cette vue offline ne tente
              aucune operation sensible.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-sm sm:flex-row">
            <Link
              className={cn(
                actionLinkClassName,
                "w-full border-transparent bg-accent text-ink-inverse shadow-sm hover:brightness-105 hover:shadow-accent sm:w-auto",
              )}
              href="/dashboard"
            >
              Reessayer
            </Link>
            <Link
              className={cn(
                actionLinkClassName,
                "w-full border-outline bg-surface-overlay text-ink-primary hover:border-outline-strong hover:bg-surface-elevated sm:w-auto",
              )}
              href="/"
            >
              Retour a l&apos;accueil
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
