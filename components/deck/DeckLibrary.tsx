"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Layers3, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, Toast } from "@/components/ui";
import type { DeckWithStats } from "@/types";
import { CreateDeckModal } from "./CreateDeckModal";
import { DeckCard } from "./DeckCard";

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
} as const;

export interface DeckLibraryProps {
  initialDecks: DeckWithStats[];
}

interface ToastState {
  description?: string;
  title: string;
}

function formatDeckCount(count: number): string {
  return `${count} ${count > 1 ? "decks" : "deck"}`;
}

export function DeckLibrary({ initialDecks }: DeckLibraryProps): JSX.Element {
  const [decks, setDecks] = useState<DeckWithStats[]>(initialDecks);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastState, setToastState] = useState<ToastState | null>(null);

  const totalCards = decks.reduce(
    (runningTotal: number, deck: DeckWithStats) => runningTotal + deck.cardCount,
    0,
  );
  const totalDueToday = decks.reduce(
    (runningTotal: number, deck: DeckWithStats) => runningTotal + deck.dueTodayCount,
    0,
  );

  return (
    <>
      <div className="space-y-lg">
        <Card className="overflow-hidden rounded-xl bg-app-canvas" glow>
          <div className="flex flex-col gap-lg xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-md">
              <Badge variant="accent">Library</Badge>

              <div className="space-y-sm">
                <h1 className="max-w-3xl text-3xl tracking-title text-ink-primary sm:text-4xl">
                  Construis une bibliotheque nette, coloree et prete pour la revision.
                </h1>
                <p className="max-w-2xl text-base text-ink-secondary">
                  Chaque deck sert de point d&apos;entree vers un sujet, une langue
                  ou un chapitre. Garde des collections precises pour fluidifier
                  les futures sessions d&apos;etude.
                </p>
              </div>
            </div>

            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setIsCreateModalOpen(true);
              }}
              variant="primary"
            >
              <Plus className="h-4 w-4" />
              Nouveau deck
            </Button>
          </div>

          <div className="mt-lg grid gap-sm sm:grid-cols-3">
            <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-sm">
              <p className="text-xs uppercase tracking-label text-ink-secondary">
                Collections
              </p>
              <p className="mt-sm text-2xl tracking-title text-ink-primary">
                {formatDeckCount(decks.length)}
              </p>
            </div>

            <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-sm">
              <p className="text-xs uppercase tracking-label text-ink-secondary">
                Cartes
              </p>
              <p className="mt-sm text-2xl tracking-title text-ink-primary">{totalCards}</p>
            </div>

            <div className="rounded-lg border border-outline-subtle bg-surface-overlay px-md py-sm">
              <p className="text-xs uppercase tracking-label text-ink-secondary">
                A revoir aujourd&apos;hui
              </p>
              <p className="mt-sm text-2xl tracking-title text-ink-primary">
                {totalDueToday}
              </p>
            </div>
          </div>
        </Card>

        {decks.length === 0 ? (
          <Card className="rounded-xl border-dashed border-outline">
            <div className="flex flex-col items-start gap-lg lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-md">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent-dim bg-accent-dim text-accent shadow-accent">
                  <Layers3 className="h-6 w-6" />
                </div>

                <div className="space-y-sm">
                  <h2 className="text-2xl tracking-title text-ink-primary">
                    Ta bibliotheque est vide pour l&apos;instant.
                  </h2>
                  <p className="max-w-2xl text-sm text-ink-secondary">
                    Cree un premier deck pour separer tes sujets, preparer une
                    session d&apos;etude et donner un cadre clair a la generation
                    future de cartes.
                  </p>
                </div>
              </div>

              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  setIsCreateModalOpen(true);
                }}
                variant="primary"
              >
                <Sparkles className="h-4 w-4" />
                Creer mon premier deck
              </Button>
            </div>
          </Card>
        ) : (
          <motion.div
            animate="show"
            className="grid gap-md md:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            variants={listVariants}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {decks.map((deck) => (
                <Link className="block h-full" href={`/decks/${deck.id}`} key={deck.id}>
                  <DeckCard className="h-full" deck={deck} variants={itemVariants} />
                </Link>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <CreateDeckModal
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
        onCreated={(deck: DeckWithStats) => {
          setDecks((currentDecks) => [deck, ...currentDecks]);
          setToastState({
            description: "Le deck est pret. Tu pourras y ajouter ou generer des cartes ensuite.",
            title: "Deck cree",
          });
        }}
        open={isCreateModalOpen}
      />

      <Toast
        description={toastState?.description}
        onClose={() => {
          setToastState(null);
        }}
        open={Boolean(toastState)}
        title={toastState?.title ?? ""}
        variant="success"
      />
    </>
  );
}
