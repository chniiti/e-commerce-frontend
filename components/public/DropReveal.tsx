"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface DropRevealProps {
  children: ReactNode;
  className?: string;
}

export function DropReveal({ children, className }: DropRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
