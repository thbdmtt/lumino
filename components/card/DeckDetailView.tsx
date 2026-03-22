"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  CalendarClock,
  ChevronDown,
  Download,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { getDeckTheme } from "@/components/deck/deck-theme";
import { Badge, Button, Card, Toast } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  cardSourceTypeValues,
  type CardRecord,
  type CardSourceType,
  type DeckWithStats,
} from "@/types";
import { CardComposer } from "./CardComposer";
import { GenerateModal } from "./GenerateModal";

const cardRecordSchema = z.object({
  back: z.string(),
  context: z.string().nullable(),
  createdAt: z.number().int().nonnegative(),
  deckId: z.string().uuid(),
  front: z.string(),
  id: z.string().uuid(),
  sourceType: z.enum(cardSourceTypeValues),
});

const cardEnvelopeSchema = z.object({
  card: cardRecordSchema,
});

const sourceTypeLabelMap: Record<CardSourceType, string> = {
  ai_pdf: "IA PDF",
  ai_text: "IA texte",
  manual: "Manuel",
};

const sourceTypeVariantMap: Record<CardSourceType, "accent" | "info" | "neutral"> = {
  ai_pdf: "info",
  ai_text: "info",
  manual: "accent",
};

interface DeckDetailViewProps {
  deck: DeckWithStats;
  initialCards: CardRecord[];
}

interface ToastState {
  description?: string;
  title: string;
  variant: "success" | "warning";
}

interface CardFormValues {
  back: string;
  context: string;
  front: string;
}

function formatDate(value: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function formatCardCount(count: number): string {
  return `${count} ${count > 1 ? "cartes" : "carte"}`;
}

export function DeckDetailView({
  deck,
  initialCards,
}: DeckDetailViewProps): JSX.Element {
  const router = useRouter();
  const deckTheme = getDeckTheme(deck.color);
  const studyHref = `/decks/${deck.id}/study`;
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const [cards, setCards] = useState<CardRecord[]>(initialCards);
  const [dueTodayCount, setDueTodayCount] = useState(deck.dueTodayCount);
  const [updatedAt, setUpdatedAt] = useState(deck.updatedAt);
  const [isCreateComposerOpen, setIsCreateComposerOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [toastState, setToastState] = useState<ToastState | null>(null);

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  useEffect(() => {
    setDueTodayCount(deck.dueTodayCount);
    setUpdatedAt(deck.updatedAt);
  }, [deck.dueTodayCount, deck.updatedAt]);

  useEffect(() => {
    if (!isExportMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (
        exportMenuRef.current &&
        event.target instanceof Node &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setIsExportMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isExportMenuOpen]);

  async function handleCreateCard(values: CardFormValues): Promise<void> {
    const response = await fetch("/api/cards", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        deckId: deck.id,
        front: values.front,
        back: values.back,
        context: values.context,
      }),
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, "Impossible d'ajouter la carte."));
    }

    const parsed = cardEnvelopeSchema.safeParse(payload);

    if (!parsed.success) {
      throw new Error("La reponse du serveur est invalide.");
    }

    setCards((currentCards) => [parsed.data.card, ...currentCards]);
    setIsCreateComposerOpen(false);
    setDueTodayCount((currentCount) => currentCount + 1);
    setUpdatedAt(Date.now());
    setToastState({
      description: "La carte a ete ajoutee au deck et apparait en tete de liste.",
      title: "Carte creee",
      variant: "success",
    });
  }

  async function handleUpdateCard(cardId: string, values: CardFormValues): Promise<void> {
    const response = await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        front: values.front,
        back: values.back,
        context: values.context,
      }),
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, "Impossible de modifier la carte."));
    }

    const parsed = cardEnvelopeSchema.safeParse(payload);

    if (!parsed.success) {
      throw new Error("La reponse du serveur est invalide.");
    }

    setCards((currentCards) =>
      currentCards.map((card) => (card.id === cardId ? parsed.data.card : card)),
    );
    setEditingCardId(null);
    setUpdatedAt(Date.now());
    setToastState({
      description: "Les changements sont enregistres pour cette carte.",
      title: "Carte mise a jour",
      variant: "success",
    });
  }

  async function handleDeleteCard(cardId: string): Promise<void> {
    if (!window.confirm("Supprimer cette carte du deck ?")) {
      return;
    }

    const response = await fetch(`/api/cards/${cardId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    if (!response.ok) {
      const payload = await readResponsePayload(response);
      setToastState({
        description: getApiErrorMessage(payload, "La suppression a echoue."),
        title: "Suppression impossible",
        variant: "warning",
      });
      return;
    }

    setCards((currentCards) => {
      const nextCards = currentCards.filter((card) => card.id !== cardId);
      setDueTodayCount((currentCount) => Math.min(currentCount, nextCards.length));
      return nextCards;
    });
    setEditingCardId((currentEditingCardId) =>
      currentEditingCardId === cardId ? null : currentEditingCardId,
    );
    setUpdatedAt(Date.now());
    setToastState({
      description: "La carte a ete retiree de la liste.",
      title: "Carte supprimee",
      variant: "success",
    });
  }

  function handleGeneratedCardsImport(importedCards: CardRecord[]): void {
    setCards((currentCards) => [...importedCards, ...currentCards]);
    setDueTodayCount((currentCount) => currentCount + importedCards.length);
    setUpdatedAt(Date.now());
  }

  function handleExport(format: "csv" | "json"): void {
    setIsExportMenuOpen(false);

    const searchParams = new URLSearchParams({
      deckId: deck.id,
      format,
    });

    window.location.assign(`/api/export?${searchParams.toString()}`);
  }

  return (
    <>
      <div className="space-y-lg">
        <section className="grid gap-md xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <Card className="overflow-hidden rounded-xl bg-app-canvas" glow>
            <div className="space-y-lg">
              <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-md">
                  <div
                    className={cn(
                      "inline-flex items-center gap-sm rounded-full border px-sm py-xs text-xs uppercase tracking-label",
                      deckTheme.surface,
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full", deckTheme.dot)} />
                    Deck detail
                  </div>

                  <div className="space-y-sm">
                    <h1 className="max-w-3xl text-3xl tracking-title text-ink-primary sm:text-4xl">
                      {deck.name}
                    </h1>
                    <p className="max-w-2xl text-base text-ink-secondary">
                      {deck.description?.trim() ||
                        "Ce deck est pret a accueillir des cartes manuelles ou generees par IA."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-sm">
                  <Button
                    onClick={() => {
                      router.push(studyHref);
                    }}
                    variant="secondary"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    Etudier
                  </Button>

                  <Button
                    onClick={() => {
                      setIsGenerateModalOpen(false);
                      setIsCreateComposerOpen((currentValue) => !currentValue);
                    }}
                    variant="primary"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>

                  <div className="relative" ref={exportMenuRef}>
                    <Button
                      aria-expanded={isExportMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => {
                        setIsExportMenuOpen((currentValue) => !currentValue);
                      }}
                      variant="ghost"
                    >
                      <Download className="h-4 w-4" />
                      Exporter
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-fast ease-smooth",
                          isExportMenuOpen ? "rotate-180" : null,
                        )}
                      />
                    </Button>

                    <AnimatePresence>
                      {isExportMenuOpen ? (
                        <motion.div
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="absolute right-0 top-[calc(100%+var(--space-sm))] z-20 min-w-[220px] rounded-xl border border-outline bg-surface-elevated p-sm shadow-lg"
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          role="menu"
                          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <button
                            className="flex w-full items-center justify-between gap-sm rounded-lg px-md py-sm text-left text-sm text-ink-primary transition-colors duration-fast ease-smooth hover:bg-surface-overlay"
                            onClick={() => {
                              handleExport("json");
                            }}
                            role="menuitem"
                            type="button"
                          >
                            <span>Exporter en JSON</span>
                            <span className="text-xs uppercase tracking-label text-ink-secondary">
                              .json
                            </span>
                          </button>

                          <button
                            className="flex w-full items-center justify-between gap-sm rounded-lg px-md py-sm text-left text-sm text-ink-primary transition-colors duration-fast ease-smooth hover:bg-surface-overlay"
                            onClick={() => {
                              handleExport("csv");
                            }}
                            role="menuitem"
                            type="button"
                          >
                            <span>Exporter en CSV</span>
                            <span className="text-xs uppercase tracking-label text-ink-secondary">
                              .csv
                            </span>
                          </button>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="grid gap-sm sm:grid-cols-3">
                <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-sm">
                  <p className="text-xs uppercase tracking-label text-ink-secondary">
                    Cartes
                  </p>
                  <p className="mt-sm text-2xl tracking-title text-ink-primary">
                    {cards.length}
                  </p>
                </div>

                <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-sm">
                  <p className="text-xs uppercase tracking-label text-ink-secondary">
                    A revoir aujourd&apos;hui
                  </p>
                  <p className="mt-sm text-2xl tracking-title text-ink-primary">
                    {dueTodayCount}
                  </p>
                </div>

                <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-sm">
                  <p className="text-xs uppercase tracking-label text-ink-secondary">
                    Derniere mise a jour
                  </p>
                  <p className="mt-sm text-2xl tracking-title text-ink-primary">
                    {formatDate(updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl">
            <div className="space-y-md">
              <Badge variant="info">Generation IA</Badge>
              <h2 className="text-2xl tracking-title text-ink-primary">
                Transforme un texte ou un PDF en cartes directement dans ce deck.
              </h2>
              <p className="text-sm text-ink-secondary">
                Lance un apercu, ajuste la selection, puis importe uniquement les cartes qui meritent de rester.
              </p>

              <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-md">
                <div className="flex items-center gap-sm text-ink-secondary">
                  <CalendarClock className="h-4 w-4" />
                  <p className="text-sm">Bibliotheque</p>
                </div>
                <p className="mt-sm text-sm text-ink-primary">
                  {formatCardCount(cards.length)} dans ce deck, dont {dueTodayCount} a
                  revoir aujourd&apos;hui.
                </p>
              </div>

              <Button
                onClick={() => {
                  setIsCreateComposerOpen(false);
                  setIsGenerateModalOpen(true);
                }}
                variant="secondary"
              >
                <Sparkles className="h-4 w-4" />
                Generer des cartes
              </Button>
            </div>
          </Card>
        </section>

        <AnimatePresence initial={false}>
          {isCreateComposerOpen ? (
            <CardComposer
              description="Ajoute une carte manuelle sans quitter le detail du deck."
              onCancel={() => {
                setIsCreateComposerOpen(false);
              }}
              onSubmit={handleCreateCard}
              submitLabel="Ajouter la carte"
              title="Nouvelle carte"
            />
          ) : null}
        </AnimatePresence>

        <section className="space-y-md">
          <div className="flex items-center justify-between gap-sm">
            <div>
              <p className="text-sm text-ink-secondary">Contenu du deck</p>
              <h2 className="mt-xs text-2xl tracking-title text-ink-primary">
                Cartes avec apercu recto / verso
              </h2>
            </div>
            <Badge variant={cards.length > 0 ? "accent" : "neutral"}>
              {formatCardCount(cards.length)}
            </Badge>
          </div>

          {cards.length === 0 ? (
            <Card className="rounded-xl border-dashed border-outline">
              <div className="flex flex-col items-start gap-md lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-sm">
                  <h3 className="text-xl tracking-title text-ink-primary">
                    Aucune carte dans ce deck pour l&apos;instant.
                  </h3>
                  <p className="max-w-2xl text-sm text-ink-secondary">
                    Commence par une carte manuelle ou lance tout de suite une generation IA depuis un texte ou un PDF.
                  </p>
                </div>

                <div className="flex flex-col gap-sm sm:flex-row">
                  <Button
                    onClick={() => {
                      setIsCreateComposerOpen(true);
                    }}
                    variant="primary"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une carte
                  </Button>

                  <Button
                    onClick={() => {
                      setIsCreateComposerOpen(false);
                      setIsGenerateModalOpen(true);
                    }}
                    variant="ghost"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generer
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-md">
              {cards.map((card) => {
                const isEditing = editingCardId === card.id;

                return (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 12 }}
                    key={card.id}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {isEditing ? (
                      <CardComposer
                        defaultValues={{
                          front: card.front,
                          back: card.back,
                          context: card.context ?? "",
                        }}
                        description="Modifie la formulation ou complete le contexte sans quitter la liste."
                        onCancel={() => {
                          setEditingCardId(null);
                        }}
                        onSubmit={async (values: CardFormValues) => {
                          await handleUpdateCard(card.id, values);
                        }}
                        submitLabel="Enregistrer les changements"
                        title="Modifier la carte"
                      />
                    ) : (
                      <Card className="rounded-xl" interactive>
                        <div className="flex flex-col gap-lg">
                          <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-wrap items-center gap-sm">
                              <Badge variant={sourceTypeVariantMap[card.sourceType]}>
                                {sourceTypeLabelMap[card.sourceType]}
                              </Badge>
                              <p className="text-xs uppercase tracking-label text-ink-secondary">
                                Creee le {formatDate(card.createdAt)}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-sm">
                              <Button
                                onClick={() => {
                                  setEditingCardId(card.id);
                                }}
                                variant="ghost"
                              >
                                <Pencil className="h-4 w-4" />
                                Editer
                              </Button>

                              <Button
                                onClick={() => {
                                  void handleDeleteCard(card.id);
                                }}
                                variant="danger"
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-md xl:grid-cols-2">
                            <div className="rounded-xl border border-outline-subtle bg-surface-overlay px-lg py-lg">
                              <p className="text-xs uppercase tracking-label text-ink-secondary">
                                Recto
                              </p>
                              <p className="mt-sm whitespace-pre-wrap text-base text-ink-primary">
                                {card.front}
                              </p>
                            </div>

                            <div className="rounded-xl border border-outline-subtle bg-surface-overlay px-lg py-lg">
                              <p className="text-xs uppercase tracking-label text-ink-secondary">
                                Verso
                              </p>
                              <p className="mt-sm whitespace-pre-wrap text-base text-ink-primary">
                                {card.back}
                              </p>
                            </div>
                          </div>

                          {card.context?.trim() ? (
                            <div className="rounded-lg border border-outline-subtle bg-surface-base px-md py-sm">
                              <p className="text-xs uppercase tracking-label text-ink-secondary">
                                Contexte
                              </p>
                              <p className="mt-sm whitespace-pre-wrap text-sm italic text-ink-secondary">
                                {card.context}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </Card>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
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

      <GenerateModal
        deckId={deck.id}
        deckName={deck.name}
        onClose={() => {
          setIsGenerateModalOpen(false);
        }}
        onImported={handleGeneratedCardsImport}
        open={isGenerateModalOpen}
        studyHref={studyHref}
      />
    </>
  );
}
