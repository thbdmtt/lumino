"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/types";

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: "border-outline-subtle bg-surface-overlay text-ink-secondary",
  accent: "border-accent-dim bg-accent-dim text-accent",
  success: "border-success-ring bg-success-dim text-success",
  warning: "border-warning-ring bg-warning-dim text-warning",
  danger: "border-danger-ring bg-danger-dim text-danger",
  info: "border-info-ring bg-info-dim text-info",
};

export interface BadgeProps extends Omit<HTMLMotionProps<"span">, "children"> {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({
  children,
  className,
  transition,
  variant = "neutral",
  whileHover,
  ...props
}: BadgeProps): JSX.Element {
  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-xs rounded-full border px-sm py-[6px] text-xs font-medium uppercase tracking-label",
        badgeVariants[variant],
        className,
      )}
      transition={transition ?? { duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      whileHover={whileHover ?? { y: -1 }}
      {...props}
    >
      {children}
    </motion.span>
  );
}
