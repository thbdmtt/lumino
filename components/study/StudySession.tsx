"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BrainCircuit, CheckCircle2, PauseCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Badge, Button, Card, Toast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { cardSourceTypeValues, type CardRecord, type DeckWithStats } from "@/types";
import { CardFlip } from "./CardFlip";

const cardRecordSchema = z.object({
  back: z.string(),
  context: z.string().nullable(),
  createdAt: z.number().int().nonnegative(),
  deckId: z.string().uuid(),
  front: z.string(),
  id: z.string().uuid(),
  sourceType: z.enum(cardSourceTypeValues),
});

const dueCardsResponseSchema = z.object({
  cards: z.array(cardRecordSchema),
  count: z.number().int().min(0),
  nextReviewAt: z.number().int().nullable(),
});

const reviewResponseSchema = z.object({
  review: z.object({
    nextReview: z.number().int().nonnegative(),
  }),
});

type StudyGrade = 2 | 3 | 4 | 5;

interface StudySessionProps {
  deck: DeckWithStats;
  initialCards: CardRecord[];
  initialNextReviewAt: number | null;
}

interface GradeAction {
  className: string;
  description: string;
  grade: StudyGrade;
  label: string;
}

interface ToastState {
  description?: string;
  title: string;
  variant: "success" | "warning";
}

const gradeActions: readonly GradeAction[] = [
  {
    className:
      "border-danger-ring bg-danger-dim text-grade-hard hover:bg-[rgba(248,113,113,0.18)]",
    description: "La carte revient vite pour consolider le rappel.",
    grade: 2,
    label: "Difficile",
  },
  {
    className:
      "border-warning-ring bg-warning-dim text-grade-ok hover:bg-[rgba(251,191,36,0.18)]",
    description: "La carte est comprise mais demande encore un effort.",
    grade: 3,
    label: "Correct",
  },
  {
    className:
      "border-success-ring bg-success-dim text-grade-good hover:bg-[rgba(74,222,128,0.18)]",
    description: "Le rappel est confortable et peut s'espacer.",
    grade: 4,
    label: "Facile",
  },
  {
    className:
      "border-info-ring bg-info-dim text-grade-perfect hover:bg-[rgba(96,165,250,0.18)]",
    description: "La carte est maitrisee avec un grand intervalle.",
    grade: 5,
    label: "Parfait",
  },
] as const;

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

async function readResponsePayload(response: Response): Promise<unknown | null> {
  const raw = await response.text();

  if (raw.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function buildInitialDistribution(): Record<StudyGrade, number> {
  return {
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
}

export function StudySession({
  deck,
  initialCards,
  initialNextReviewAt,
}: StudySessionProps): JSX.Element {
  const router = useRouter();
  const [remainingCards, setRemainingCards] = useState<CardRecord[]>(initialCards);
  const [distribution, setDistribution] = useState<Record<StudyGrade, number>>(
    buildInitialDistribution(),
  );
  const [flipped, setFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNextReviewAt, setIsLoadingNextReviewAt] = useState(false);
  const [nextReviewAt, setNextReviewAt] = useState<number | null>(initialNextReviewAt);
  const [toastState, setToastState] = useState<ToastState | null>(null);

  const deckHref = `/decks/${deck.id}`;
  const studyHref = `/decks/${deck.id}/study`;
  const initialTotal = initialCards.length;
  const reviewedCount = initialTotal - remainingCards.length;
  const currentCard = remainingCards[0] ?? null;
  const currentPosition = currentCard ? reviewedCount + 1 : reviewedCount;
  const progressPercentage =
    initialTotal === 0 ? 0 : Math.round((reviewedCount / initialTotal) * 100);
  const isComplete = initialTotal > 0 && remainingCards.length === 0;
  const totalDistribution = useMemo(
    () =>
      gradeActions.map((action) => ({
        ...action,
        count: distribution[action.grade],
      })),
    [distribution],
  );

  async function refreshNextReviewAt(): Promise<void> {
    setIsLoadingNextReviewAt(true);

    try {
      const response = await fetch(`/api/cards/due?deckId=${deck.id}`, {
        credentials: "same-origin",
      });
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Impossible de recuperer la prochaine session."));
      }

      const parsed = dueCardsResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("La reponse du serveur est invalide.");
      }

      setNextReviewAt(parsed.data.nextReviewAt);
    } catch (error) {
      setToastState({
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant la synchronisation.",
        title: "Session terminee",
        variant: "warning",
      });
    } finally {
      setIsLoadingNextReviewAt(false);
    }
  }

  async function handleGrade(grade: StudyGrade): Promise<void> {
    if (!currentCard || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/cards/${currentCard.id}/review`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ grade }),
      });
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Impossible d'enregistrer cette note."));
      }

      const parsed = reviewResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("La reponse du serveur est invalide.");
      }

      setDistribution((currentDistribution) => ({
        ...currentDistribution,
        [grade]: currentDistribution[grade] + 1,
      }));
      setRemainingCards((currentCards) => currentCards.slice(1));
      setNextReviewAt(parsed.data.review.nextReview);
      setFlipped(false);

      if (remainingCards.length === 1) {
        await refreshNextReviewAt();
      }
    } catch (error) {
      setToastState({
        description:
          error instanceof Error ? error.message : "Une erreur est survenue pendant la notation.",
        title: "Notation impossible",
        variant: "warning",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (initialTotal === 0) {
    return (
      <>
        <Card className="rounded-xl bg-app-canvas" glow>
          <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-md">
              <Badge variant="info">Rien a reviser</Badge>
              <div className="space-y-sm">
                <h2 className="text-3xl tracking-title text-ink-primary">
                  Ce deck n&apos;a aucune carte due pour le moment.
                </h2>
                <p className="max-w-2xl text-sm text-ink-secondary">
                  {nextReviewAt
                    ? `La prochaine carte de ${deck.name} reviendra le ${formatDateTime(nextReviewAt)}.`
                    : "Aucune prochaine session n'est planifiee. Ajoute des cartes ou attends la prochaine echeance SM-2."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-sm sm:flex-row">
              <Button
                onClick={() => {
                  router.push(deckHref);
                }}
                variant="ghost"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au deck
              </Button>

              <Button
                onClick={() => {
                  router.push(studyHref);
                }}
                variant="secondary"
              >
                <Sparkles className="h-4 w-4" />
                Recharger
              </Button>
            </div>
          </div>
        </Card>
      </>
    );
  }

  if (isComplete) {
    return (
      <>
        <div className="space-y-lg">
          <Card className="rounded-xl bg-app-canvas" glow>
            <div className="flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-sm">
                <Badge variant="success">Session terminee</Badge>
                <h2 className="text-3xl tracking-title text-ink-primary">
                  {initialTotal} carte{initialTotal > 1 ? "s" : ""} revue
                  {initialTotal > 1 ? "s" : ""} dans {deck.name}
                </h2>
                <p className="max-w-2xl text-sm text-ink-secondary">
                  La session est enregistree. Les prochains intervalles ont ete recalcules via SM-2.
                </p>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-success-ring bg-success-dim">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
          </Card>

          <section className="grid gap-md xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="rounded-xl">
              <div className="space-y-md">
                <div>
                  <p className="text-sm text-ink-secondary">Stats de session</p>
                  <h3 className="mt-xs text-2xl tracking-title text-ink-primary">
                    Repartition des notes
                  </h3>
                </div>

                <div className="grid gap-sm sm:grid-cols-2">
                  {totalDistribution.map((item) => (
                    <div
                      className={cn(
                        "rounded-xl border px-md py-md",
                        item.className,
                      )}
                      key={item.grade}
                    >
                      <p className="text-xs uppercase tracking-label">{item.label}</p>
                      <p className="mt-sm text-3xl tracking-title">{item.count}</p>
                      <p className="mt-sm text-sm text-ink-secondary">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="rounded-xl">
              <div className="space-y-md">
                <Badge variant="accent">Prochaine session</Badge>
                <div>
                  <p className="text-sm text-ink-secondary">Prochaine carte due</p>
                  <h3 className="mt-xs text-2xl tracking-title text-ink-primary">
                    {isLoadingNextReviewAt
                      ? "Calcul en cours..."
                      : nextReviewAt
                        ? formatDateTime(nextReviewAt)
                        : "Aucune date planifiee"}
                  </h3>
                </div>

                <p className="text-sm text-ink-secondary">
                  {isLoadingNextReviewAt
                    ? "Lumino termine de synchroniser les prochaines echeances."
                    : nextReviewAt
                      ? "Reviens a cette date pour reprendre le deck au meilleur moment."
                      : "Aucune carte n'est planifiee pour l'instant sur ce deck."}
                </p>

                <div className="flex flex-col gap-sm">
                  <Button
                    onClick={() => {
                      router.push(deckHref);
                    }}
                    variant="primary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour au deck
                  </Button>

                  <Button
                    onClick={() => {
                      router.push(studyHref);
                    }}
                    variant="ghost"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    Recharger la session
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        </div>

        <Toast
          description={toastState?.description}
          onClose={() => {
            setToastState(null);
          }}
          open={Boolean(toastState)}
          title={toastState?.title ?? ""}
          variant={toastState?.variant ?? "success"}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-lg">
        <Card className="rounded-xl">
          <div className="space-y-md">
            <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-xs">
                <p className="text-sm text-ink-secondary">Session en cours</p>
                <h2 className="text-2xl tracking-title text-ink-primary">
                  {deck.name} · {currentPosition} / {initialTotal}
                </h2>
              </div>

              <Button
                disabled={isSubmitting}
                onClick={() => {
                  router.push(deckHref);
                }}
                variant="ghost"
              >
                <PauseCircle className="h-4 w-4" />
                Pause / quitter
              </Button>
            </div>

            <div className="space-y-sm">
              <div className="flex items-center justify-between gap-sm">
                <p className="text-sm text-ink-secondary">Progression</p>
                <Badge variant="neutral">{progressPercentage}%</Badge>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-surface-overlay">
                <motion.div
                  animate={{ width: `${progressPercentage}%` }}
                  className="h-full rounded-full bg-accent"
                  initial={false}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>
          </div>
        </Card>

        {currentCard ? (
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 8 }}
              key={currentCard.id}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              <CardFlip
                card={currentCard}
                disabled={isSubmitting}
                flipped={flipped}
                onFlip={() => {
                  if (!isSubmitting) {
                    setFlipped((currentValue) => !currentValue);
                  }
                }}
              />
            </motion.div>
          </AnimatePresence>
        ) : null}

        <AnimatePresence initial={false}>
          {flipped && currentCard ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-sm sm:grid-cols-2 xl:grid-cols-4"
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {gradeActions.map((action, index) => (
                <motion.button
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex min-h-[72px] flex-col items-start justify-center gap-xs rounded-full border px-md py-sm text-left transition-all duration-fast ease-spring disabled:cursor-not-allowed disabled:opacity-50",
                    action.className,
                  )}
                  disabled={isSubmitting}
                  initial={{ opacity: 0, y: 10 }}
                  key={action.grade}
                  onClick={() => {
                    void handleGrade(action.grade);
                  }}
                  transition={{
                    duration: 0.18,
                    ease: [0.4, 0, 0.2, 1],
                    delay: index * 0.05,
                  }}
                  type="button"
                  whileTap={isSubmitting ? undefined : { scale: 0.97 }}
                >
                  <span className="text-sm font-semibold">{action.label}</span>
                  <span className="text-xs text-ink-secondary">{action.description}</span>
                </motion.button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Toast
        description={toastState?.description}
        onClose={() => {
          setToastState(null);
        }}
        open={Boolean(toastState)}
        title={toastState?.title ?? ""}
        variant={toastState?.variant ?? "success"}
      />
    </>
  );
}
