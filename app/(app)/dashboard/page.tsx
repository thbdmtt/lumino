import {
  ArrowRight,
  BrainCircuit,
  Clock3,
  Flame,
  Layers3,
  LibraryBig,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getDeckTheme } from "@/components/deck/deck-theme";
import { Badge, Card } from "@/components/ui";
import { requireServerSession } from "@/lib/auth/server-session";
import { listDecksWithStatsByUserId } from "@/lib/db/queries";
import {
  getNextScheduledReviewAt,
  getStudyStreak,
  getTotalReviewCount,
} from "@/lib/db/reviews";
import { cn } from "@/lib/utils";
import type { DashboardSummary, DeckWithStats } from "@/types";

const actionLinkClassName =
  "inline-flex min-h-[44px] items-center justify-center gap-sm rounded-full border border-outline bg-surface-overlay px-md py-[10px] text-sm font-semibold text-ink-primary transition-all duration-fast ease-spring hover:border-outline-strong hover:bg-surface-elevated";

function formatCardLabel(count: number): string {
  return `${count} carte${count > 1 ? "s" : ""}`;
}

function formatDeckLabel(count: number): string {
  return `${count} deck${count > 1 ? "s" : ""}`;
}

function formatStudyDayLabel(count: number): string {
  return `${count} jour${count > 1 ? "s" : ""}`;
}

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sumCount(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function buildDashboardSummary(
  decks: DeckWithStats[],
  streakDays: number,
  totalReviews: number,
  nextReviewAt: number | null,
): DashboardSummary {
  return {
    dueTodayCount: sumCount(decks.map((deck) => deck.dueTodayCount)),
    nextReviewAt,
    recentDecks: decks.slice(0, 3),
    streakDays,
    totalCards: sumCount(decks.map((deck) => deck.cardCount)),
    totalReviews,
  };
}

interface StatCard {
  description: string;
  icon: typeof BrainCircuit;
  label: string;
  value: string;
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await requireServerSession();
  const [decks, streakDays, totalReviews, nextReviewAt] = await Promise.all([
    listDecksWithStatsByUserId(session.user.id),
    getStudyStreak(session.user.id),
    getTotalReviewCount(session.user.id),
    getNextScheduledReviewAt(session.user.id),
  ]);

  const summary = buildDashboardSummary(decks, streakDays, totalReviews, nextReviewAt);
  const dueDecks = decks.filter((deck) => deck.dueTodayCount > 0);
  const stats: StatCard[] = [
    {
      description:
        summary.dueTodayCount > 0
          ? `${formatDeckLabel(dueDecks.length)} concernes aujourd'hui.`
          : "Aucune carte due en ce moment.",
      icon: BrainCircuit,
      label: "A reviser aujourd'hui",
      value: String(summary.dueTodayCount),
    },
    {
      description:
        summary.streakDays > 0
          ? "Tu maintiens une dynamique reguliere."
          : "La prochaine session relancera la serie.",
      icon: Flame,
      label: "Streak",
      value: formatStudyDayLabel(summary.streakDays),
    },
    {
      description:
        summary.totalCards > 0
          ? "Volume total actuellement disponible dans la bibliotheque."
          : "Aucune carte creee pour l'instant.",
      icon: Layers3,
      label: "Total cartes",
      value: String(summary.totalCards),
    },
    {
      description:
        summary.totalReviews > 0
          ? "Revisions memorisees dans l'etat SM-2."
          : "Aucune revision enregistree pour le moment.",
      icon: Clock3,
      label: "Total revisions",
      value: String(summary.totalReviews),
    },
  ];

  return (
    <div className="space-y-lg">
      <section className="grid gap-md xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card className="rounded-xl" interactive key={stat.label}>
              <div className="flex items-start justify-between gap-md">
                <div className="space-y-sm">
                  <p className="text-sm text-ink-secondary">{stat.label}</p>
                  <p className="text-3xl tracking-title text-ink-primary">{stat.value}</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-subtle bg-surface-overlay text-accent">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-md text-sm text-ink-secondary">{stat.description}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-md lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-xl bg-app-canvas" glow>
          <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-sm">
                <Badge variant={summary.dueTodayCount > 0 ? "warning" : "accent"}>
                  A reviser aujourd&apos;hui
                </Badge>
                <div className="space-y-sm">
                  <h2 className="text-3xl tracking-title text-ink-primary">
                    {summary.dueTodayCount > 0
                      ? `${summary.dueTodayCount} carte${summary.dueTodayCount > 1 ? "s" : ""} t'attendent`
                      : "Le tableau est calme pour l'instant"}
                  </h2>
                  <p className="max-w-2xl text-sm text-ink-secondary">
                    {summary.dueTodayCount > 0
                      ? "Toutes les cartes dues sont regroupees ici pour lancer rapidement la bonne session."
                      : summary.nextReviewAt
                        ? `La prochaine carte reviendra le ${formatDateTime(summary.nextReviewAt)}.`
                        : "Ajoute des cartes ou termine d'enrichir tes decks pour lancer les prochaines revisions."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-sm sm:flex-row">
                <Link
                  className={cn(actionLinkClassName, "border-accent-dim bg-accent-dim text-accent hover:brightness-105")}
                  href={dueDecks[0] ? `/decks/${dueDecks[0].id}/study` : "/decks"}
                >
                  {summary.dueTodayCount > 0 ? "Lancer la prochaine session" : "Ouvrir les decks"}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link className={actionLinkClassName} href="/decks">
                  Voir la bibliotheque
                </Link>
              </div>
            </div>

            {dueDecks.length > 0 ? (
              <div className="grid gap-sm md:grid-cols-2">
                {dueDecks.map((deck) => {
                  const theme = getDeckTheme(deck.color);

                  return (
                    <Link href={`/decks/${deck.id}/study`} key={deck.id}>
                      <Card className="rounded-xl" interactive>
                        <div className="flex items-start justify-between gap-md">
                          <div className="min-w-0 space-y-sm">
                            <div
                              className={cn(
                                "inline-flex items-center gap-sm rounded-full border px-sm py-xs text-xs uppercase tracking-label",
                                theme.surface,
                              )}
                            >
                              <span className={cn("h-2.5 w-2.5 rounded-full", theme.dot)} />
                              Deck actif
                            </div>

                            <div className="space-y-xs">
                              <h3 className="truncate text-xl tracking-title text-ink-primary">
                                {deck.name}
                              </h3>
                              <p className="line-clamp-2 text-sm text-ink-secondary">
                                {deck.description?.trim() ||
                                  "Deck pret a etre revise tout de suite."}
                              </p>
                            </div>
                          </div>

                          <Badge variant="warning">{deck.dueTodayCount} dues</Badge>
                        </div>

                        <div className="mt-md flex items-center justify-between gap-sm text-sm text-ink-secondary">
                          <span>{formatCardLabel(deck.cardCount)}</span>
                          <span className="inline-flex items-center gap-xs text-ink-primary">
                            Etudier
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card className="rounded-xl border-dashed border-outline">
                <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-sm">
                    <h3 className="text-xl tracking-title text-ink-primary">
                      Rien a reviser aujourd&apos;hui.
                    </h3>
                    <p className="max-w-2xl text-sm text-ink-secondary">
                      {summary.nextReviewAt
                        ? `La prochaine revision globale est prevue le ${formatDateTime(summary.nextReviewAt)}.`
                        : "Commence par creer un deck ou ajouter de nouvelles cartes pour amorcer les prochaines sessions."}
                    </p>
                  </div>

                  <Link className={cn(actionLinkClassName, "justify-center")} href="/decks">
                    Parcourir les decks
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </Card>

        <div className="space-y-md">
          <Card className="rounded-xl">
            <div className="flex items-start justify-between gap-md">
              <div className="space-y-sm">
                <Badge variant="info">Decks recents</Badge>
                <div className="space-y-xs">
                  <h2 className="text-2xl tracking-title text-ink-primary">
                    Les 3 derniers decks touches
                  </h2>
                  <p className="text-sm text-ink-secondary">
                    Reprends un deck recent ou bascule directement vers sa prochaine session.
                  </p>
                </div>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-subtle bg-surface-overlay text-accent">
                <LibraryBig className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-lg space-y-sm">
              {summary.recentDecks.length > 0 ? (
                summary.recentDecks.map((deck) => {
                  const theme = getDeckTheme(deck.color);

                  return (
                    <Link
                      className="block rounded-xl transition-transform duration-fast ease-spring hover:-translate-y-[1px]"
                      href={`/decks/${deck.id}`}
                      key={deck.id}
                    >
                      <div className="rounded-xl border border-outline-subtle bg-surface-overlay px-md py-md">
                        <div className="flex items-center justify-between gap-sm">
                          <div className="min-w-0 space-y-xs">
                            <div
                              className={cn(
                                "inline-flex items-center gap-sm rounded-full border px-sm py-xs text-xs uppercase tracking-label",
                                theme.surface,
                              )}
                            >
                              <span className={cn("h-2.5 w-2.5 rounded-full", theme.dot)} />
                              Recent
                            </div>
                            <h3 className="truncate text-lg tracking-title text-ink-primary">
                              {deck.name}
                            </h3>
                          </div>

                          <Badge variant={deck.dueTodayCount > 0 ? "warning" : "neutral"}>
                            {deck.dueTodayCount > 0 ? `${deck.dueTodayCount} dues` : "A jour"}
                          </Badge>
                        </div>

                        <div className="mt-md flex items-center justify-between gap-sm text-sm text-ink-secondary">
                          <span>{formatCardLabel(deck.cardCount)}</span>
                          <span>{formatDateTime(deck.updatedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-outline px-md py-lg">
                  <p className="text-sm text-ink-primary">
                    Aucun deck n&apos;a encore ete cree.
                  </p>
                  <p className="mt-sm text-sm text-ink-secondary">
                    Ouvre la bibliotheque pour lancer ton premier deck et commencer les revisions.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-xl">
            <div className="flex items-start justify-between gap-md">
              <div className="space-y-sm">
                <Badge variant="accent">Momentum</Badge>
                <h2 className="text-2xl tracking-title text-ink-primary">
                  {summary.streakDays > 0
                    ? `${formatStudyDayLabel(summary.streakDays)} consecutif${summary.streakDays > 1 ? "s" : ""}`
                    : "Aucune serie active"}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-subtle bg-surface-overlay text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-md text-sm text-ink-secondary">
              {summary.streakDays > 0
                ? "Chaque jour consecutif renforce la regularite des rappels. Continue avec une session courte pour entretenir le rythme."
                : "Une seule session suffit pour relancer le streak et remettre les revisions dans le flux quotidien."}
            </p>

            <div className="mt-lg flex flex-col gap-sm sm:flex-row">
              <Link
                className={cn(
                  actionLinkClassName,
                  summary.dueTodayCount > 0
                    ? "border-accent-dim bg-accent-dim text-accent hover:brightness-105"
                    : null,
                )}
                href={dueDecks[0] ? `/decks/${dueDecks[0].id}/study` : "/decks"}
              >
                {summary.dueTodayCount > 0 ? "Etudier maintenant" : "Explorer les decks"}
              </Link>

              <Link className={actionLinkClassName} href="/decks">
                Gérer mes decks
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
