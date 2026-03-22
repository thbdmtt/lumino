"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import type { ReactNode, ReactPortal } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalProps {
  children: ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  title?: string;
}

export function Modal({
  children,
  className,
  closeOnOverlayClick = true,
  description,
  footer,
  onClose,
  open,
  title,
}: ModalProps): ReactPortal | null {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,8,8,0.78)] px-md pt-xl backdrop-blur-sm sm:items-center sm:px-lg"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={() => {
            if (closeOnOverlayClick) {
              onClose();
            }
          }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-describedby={description ? descriptionId : undefined}
            aria-label={title ? undefined : "Modal"}
            aria-labelledby={title ? titleId : undefined}
            aria-modal="true"
            className={cn(
              "w-full max-w-xl rounded-t-xl border border-outline bg-surface-elevated shadow-lg sm:rounded-xl",
              className,
            )}
            exit={{ opacity: 0, scale: 0.98, y: 24 }}
            initial={{ opacity: 0, scale: 0.98, y: 24 }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            role="dialog"
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-start justify-between gap-md border-b border-outline-subtle px-lg py-lg">
              <div className="space-y-xs">
                {title ? (
                  <h2 className="text-xl tracking-title text-ink-primary" id={titleId}>
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="text-sm text-ink-secondary" id={descriptionId}>
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                aria-label="Close modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-subtle bg-surface-overlay text-sm text-ink-secondary transition-colors duration-fast ease-smooth hover:border-outline hover:text-ink-primary"
                onClick={onClose}
                type="button"
              >
                X
              </button>
            </div>

            <div className="px-lg py-lg">{children}</div>

            {footer ? (
              <div className="border-t border-outline-subtle px-lg py-lg pb-[calc(var(--space-lg)+env(safe-area-inset-bottom))] sm:pb-lg">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
