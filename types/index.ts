export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type SpinnerSize = "sm" | "md" | "lg";

export type ToastVariant = "neutral" | "success" | "warning" | "danger" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export const deckColorValues = [
  "#6366F1",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#8B5CF6",
  "#10B981",
  "#EF4444",
  "#3B82F6",
] as const;

export type DeckColor = (typeof deckColorValues)[number];

export interface DeckWithStats {
  cardCount: number;
  color: string;
  createdAt: number;
  description: string | null;
  dueTodayCount: number;
  id: string;
  name: string;
  updatedAt: number;
  userId: string;
}

export const reviewGradeValues = [0, 1, 2, 3, 4, 5] as const;

export type ReviewGrade = (typeof reviewGradeValues)[number];

export const cardSourceTypeValues = ["ai_text", "ai_pdf", "manual"] as const;

export type CardSourceType = (typeof cardSourceTypeValues)[number];

export interface CardRecord {
  back: string;
  context: string | null;
  createdAt: number;
  deckId: string;
  front: string;
  id: string;
  sourceType: CardSourceType;
}

export interface DashboardSummary {
  dueTodayCount: number;
  nextReviewAt: number | null;
  recentDecks: DeckWithStats[];
  streakDays: number;
  totalCards: number;
  totalReviews: number;
}
