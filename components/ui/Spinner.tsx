"use client";

import { motion } from "framer-motion";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { SpinnerSize } from "@/types";

const spinnerSizes: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-[3px]",
};

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  label?: string;
  size?: SpinnerSize;
}

export function Spinner({
  className,
  label = "Loading",
  size = "md",
  ...props
}: SpinnerProps): JSX.Element {
  return (
    <span
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-ink-secondary", className)}
      role="status"
      {...props}
    >
      <motion.span
        animate={{ rotate: 360 }}
        aria-hidden="true"
        className={cn(
          "block rounded-full border-accent-dim border-t-accent",
          spinnerSizes[size],
        )}
        transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
