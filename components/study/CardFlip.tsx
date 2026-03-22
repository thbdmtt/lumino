"use client";

import { motion } from "framer-motion";
import type { CardRecord } from "@/types";
import { cn } from "@/lib/utils";

interface CardFlipProps {
  card: CardRecord;
  disabled?: boolean;
  flipped: boolean;
  onFlip: () => void;
}

export function CardFlip({
  card,
  disabled = false,
  flipped,
  onFlip,
}: CardFlipProps): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-4xl [perspective:1000px]">
      <motion.button
        animate={{ rotateY: flipped ? 180 : 0 }}
        aria-label={flipped ? "Afficher le recto" : "Afficher le verso"}
        className={cn(
          "relative min-h-[320px] w-full rounded-xl border border-outline-subtle bg-surface-elevated text-left shadow-lg transition-colors duration-normal ease-smooth sm:min-h-[380px]",
          disabled ? "cursor-wait" : "cursor-pointer hover:border-outline",
        )}
        disabled={disabled}
        onClick={onFlip}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        type="button"
      >
        <div className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,var(--bg-elevated),var(--bg-overlay))] [backface-visibility:hidden]">
          <div className="flex h-full flex-col justify-between px-xl py-xl">
            <div className="flex items-center justify-between gap-sm">
              <p className="text-xs uppercase tracking-label text-ink-secondary">
                Recto
              </p>
              <p className="text-xs text-ink-secondary">Toucher pour retourner</p>
            </div>

            <div className="mx-auto flex max-w-3xl flex-1 items-center justify-center">
              <p className="text-center text-xl tracking-title text-ink-primary sm:text-2xl">
                {card.front}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-xl bg-surface-elevated [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex h-full flex-col justify-between px-xl py-xl">
            <div className="flex items-center justify-between gap-sm">
              <p className="text-xs uppercase tracking-label text-ink-secondary">
                Verso
              </p>
              <p className="text-xs text-ink-secondary">Noter ensuite la difficulte</p>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-lg">
              <p className="max-w-3xl text-center text-lg text-ink-primary sm:text-xl">
                {card.back}
              </p>

              {card.context?.trim() ? (
                <div className="w-full max-w-2xl border-t border-outline-subtle pt-md">
                  <p className="text-center text-sm italic text-ink-tertiary">
                    {card.context}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
