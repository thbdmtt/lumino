"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  glow?: boolean;
  interactive?: boolean;
}

export function Card({
  children,
  className,
  glow = false,
  interactive = false,
  transition,
  whileHover,
  ...props
}: CardProps): JSX.Element {
  return (
    <motion.div
      className={cn(
        "rounded-lg border border-outline-subtle bg-surface-elevated p-lg shadow-sm backdrop-blur-glass transition-[border-color,box-shadow,transform] duration-normal ease-smooth",
        glow ? "bg-surface-sheen shadow-accent" : null,
        interactive
          ? "hover:border-outline hover:shadow-md"
          : "hover:border-outline-subtle",
        className,
      )}
      transition={transition ?? { duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      whileHover={interactive ? whileHover ?? { y: -2 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}
