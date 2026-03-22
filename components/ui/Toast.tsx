"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactPortal } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { ToastAction, ToastVariant } from "@/types";

const toastAccentClasses: Record<ToastVariant, string> = {
  neutral: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

const toastActionClasses: Record<ToastVariant, string> = {
  neutral: "border-accent-dim bg-accent-dim text-accent",
  success: "border-success-ring bg-success-dim text-success",
  warning: "border-warning-ring bg-warning-dim text-warning",
  danger: "border-danger-ring bg-danger-dim text-danger",
  info: "border-info-ring bg-info-dim text-info",
};

export interface ToastProps {
  action?: ToastAction;
  className?: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  open: boolean;
  title: string;
  variant?: ToastVariant;
}

export function Toast({
  action,
  className,
  description,
  duration = 4000,
  onClose,
  open,
  title,
  variant = "neutral",
}: ToastProps): ReactPortal | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !onClose || duration <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [duration, onClose, open]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-md z-50 flex justify-center px-md pb-[env(safe-area-inset-bottom)] sm:bottom-lg">
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-live={variant === "danger" ? "assertive" : "polite"}
            className={cn(
              "pointer-events-auto relative w-full max-w-md overflow-hidden rounded-lg border border-outline bg-surface-elevated shadow-lg backdrop-blur-glass",
              className,
            )}
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            role={variant === "danger" ? "alert" : "status"}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-0 left-0 w-1",
                toastAccentClasses[variant],
              )}
            />

            <div className="flex items-start gap-md px-lg py-md">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-primary">{title}</p>
                {description ? (
                  <p className="mt-xs text-sm text-ink-secondary">{description}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-sm">
                {action ? (
                  <button
                    className={cn(
                      "rounded-full border px-sm py-xs text-xs font-medium uppercase tracking-label transition-colors duration-fast ease-smooth hover:brightness-110",
                      toastActionClasses[variant],
                    )}
                    onClick={action.onClick}
                    type="button"
                  >
                    {action.label}
                  </button>
                ) : null}

                {onClose ? (
                  <button
                    aria-label="Dismiss notification"
                    className="rounded-full border border-outline-subtle bg-surface-overlay px-sm py-xs text-xs text-ink-secondary transition-colors duration-fast ease-smooth hover:border-outline hover:text-ink-primary"
                    onClick={onClose}
                    type="button"
                  >
                    Close
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
