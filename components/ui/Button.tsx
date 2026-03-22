"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ButtonVariant } from "@/types";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-accent text-ink-inverse shadow-sm hover:brightness-105 hover:shadow-accent",
  secondary:
    "border-outline bg-surface-overlay text-ink-primary hover:border-outline-strong hover:bg-surface-elevated",
  ghost:
    "border-transparent bg-transparent text-ink-secondary hover:bg-surface-glass hover:text-ink-primary",
  danger:
    "border-danger-ring bg-danger-dim text-danger hover:border-danger hover:bg-[rgba(248,113,113,0.16)]",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export function Button({
  children,
  className,
  disabled,
  transition,
  type = "button",
  variant = "primary",
  whileHover,
  whileTap,
  ...props
}: ButtonProps): JSX.Element {
  const isDisabled = Boolean(disabled);

  return (
    <motion.button
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-sm rounded-full border px-md py-[10px] text-base font-semibold tracking-body transition-all duration-fast ease-spring focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        className,
      )}
      disabled={isDisabled}
      transition={transition ?? { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      type={type}
      whileHover={isDisabled ? undefined : whileHover ?? { y: -1, scale: 1.01 }}
      whileTap={isDisabled ? undefined : whileTap ?? { scale: 0.97 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
