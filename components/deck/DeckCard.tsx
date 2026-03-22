"use client";

import { Clock3, Layers3 } from "lucide-react";
import type { HTMLMotionProps } from "framer-motion";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DeckWithStats } from "@/types";
import { getDeckTheme } from "./deck-theme";

export interface DeckCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  deck: DeckWithStats;
}

function formatCardCount(count: number): string {
  return `${count} ${count > 1 ? "cartes" : "carte"}`;
}

function formatDueCount(count: number): string {
  return count > 0 ? `${count} a revoir` : "Rien a revoir";
}

export function DeckCard({
  className,
  deck,
  ...props
}: DeckCardProps): JSX.Element {
  const deckTheme = getDeckTheme(deck.color);

  return (
    <Card
      className={cn("overflow-hidden rounded-xl p-0", className)}
      interactive
      layout
      {...props}
    >
      <div className={cn("h-[3px] w-full", deckTheme.topBar)} />

      <div className="space-y-lg px-lg py-lg">
        <div className="flex items-start justify-between gap-md">
          <div className="min-w-0 space-y-sm">
            <div
              className={cn(
                "inline-flex items-center gap-sm rounded-full border px-sm py-xs text-xs uppercase tracking-label",
                deckTheme.surface,
              )}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", deckTheme.dot)} />
              Deck
            </div>

            <div className="space-y-xs">
              <h2 className="line-clamp-2 text-xl tracking-title text-ink-primary">
                {deck.name}
              </h2>
              <p className="line-clamp-3 min-h-[72px] text-sm text-ink-secondary">
                {deck.description?.trim() ||
                  "Ajoute une description pour donner le ton du deck et garder une bibliotheque claire."}
              </p>
            </div>
          </div>

          <Badge variant={deck.dueTodayCount > 0 ? "warning" : "accent"}>
            {formatDueCount(deck.dueTodayCount)}
          </Badge>
        </div>

        <div className="grid gap-sm sm:grid-cols-2">
          <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-sm">
            <div className="flex items-center gap-sm text-ink-secondary">
              <Layers3 className="h-4 w-4" />
              <p className="text-xs uppercase tracking-label">Contenu</p>
            </div>
            <p className="mt-sm text-lg text-ink-primary">{formatCardCount(deck.cardCount)}</p>
          </div>

          <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-sm">
            <div className="flex items-center gap-sm text-ink-secondary">
              <Clock3 className="h-4 w-4" />
              <p className="text-xs uppercase tracking-label">Aujourd&apos;hui</p>
            </div>
            <p className="mt-sm text-lg text-ink-primary">{deck.dueTodayCount}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
