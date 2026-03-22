"use client";

import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  className?: string;
  containerClassName?: string;
  error?: string;
  hint?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, containerClassName, error, hint, id, label, ...props },
  ref,
): JSX.Element {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-sm", containerClassName)}>
      {label ? (
        <label
          className="block text-sm font-medium text-ink-primary"
          htmlFor={inputId}
        >
          {label}
        </label>
      ) : null}

      <input
        {...props}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full appearance-none rounded-md border border-outline-subtle bg-surface-overlay px-md py-[12px] text-base text-ink-primary shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-normal ease-smooth placeholder:text-ink-tertiary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-dim)]",
          error
            ? "border-danger shadow-[0_0_0_3px_var(--danger-dim)] focus-visible:border-danger focus-visible:shadow-[0_0_0_3px_var(--danger-dim)]"
            : null,
          className,
        )}
        id={inputId}
        ref={ref}
      />

      {hint ? (
        <p className="text-xs text-ink-secondary" id={hintId}>
          {hint}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-danger"
            exit={{ opacity: 0, y: -2 }}
            id={errorId}
            initial={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = "Input";
