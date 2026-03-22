import { cn } from "@/lib/utils";
import type { DeckColor } from "@/types";

interface DeckTheme {
  dot: string;
  surface: string;
  topBar: string;
}

const DEFAULT_DECK_COLOR: DeckColor = "#6366F1";

const deckThemes: Record<DeckColor, DeckTheme> = {
  "#6366F1": {
    dot: "bg-deck-1",
    surface:
      "border-[rgba(99,102,241,0.28)] bg-[rgba(99,102,241,0.12)] text-deck-1",
    topBar: "bg-deck-1",
  },
  "#EC4899": {
    dot: "bg-deck-2",
    surface:
      "border-[rgba(236,72,153,0.28)] bg-[rgba(236,72,153,0.12)] text-deck-2",
    topBar: "bg-deck-2",
  },
  "#14B8A6": {
    dot: "bg-deck-3",
    surface:
      "border-[rgba(20,184,166,0.28)] bg-[rgba(20,184,166,0.12)] text-deck-3",
    topBar: "bg-deck-3",
  },
  "#F59E0B": {
    dot: "bg-deck-4",
    surface:
      "border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.12)] text-deck-4",
    topBar: "bg-deck-4",
  },
  "#8B5CF6": {
    dot: "bg-deck-5",
    surface:
      "border-[rgba(139,92,246,0.28)] bg-[rgba(139,92,246,0.12)] text-deck-5",
    topBar: "bg-deck-5",
  },
  "#10B981": {
    dot: "bg-deck-6",
    surface:
      "border-[rgba(16,185,129,0.28)] bg-[rgba(16,185,129,0.12)] text-deck-6",
    topBar: "bg-deck-6",
  },
  "#EF4444": {
    dot: "bg-deck-7",
    surface:
      "border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.12)] text-deck-7",
    topBar: "bg-deck-7",
  },
  "#3B82F6": {
    dot: "bg-deck-8",
    surface:
      "border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.12)] text-deck-8",
    topBar: "bg-deck-8",
  },
};

function isDeckColor(value: string): value is DeckColor {
  return value in deckThemes;
}

export function getDeckTheme(color: string): DeckTheme {
  return deckThemes[isDeckColor(color) ? color : DEFAULT_DECK_COLOR];
}

export function getDeckColorButtonClassName(color: string, selected: boolean): string {
  const theme = getDeckTheme(color);

  return cn(
    "relative inline-flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-fast ease-spring",
    theme.dot,
    selected
      ? "scale-105 border-outline-strong ring-2 ring-accent-dim ring-offset-2 ring-offset-background"
      : "border-transparent opacity-80 hover:scale-[1.02] hover:opacity-100",
  );
}
