"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface MagneticCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
  accent?: "molten" | "cyan" | "neutral";
}

export function MagneticCard({
  children,
  className,
  index = 0,
  accent = "neutral",
}: MagneticCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 40 });

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 10,
      ry: (px - 0.5) * 12,
      gx: px * 100,
      gy: py * 100,
    });
  };

  const onPointerLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 40 });
  };

  const style = {
    "--rx": `${tilt.rx.toFixed(2)}deg`,
    "--ry": `${tilt.ry.toFixed(2)}deg`,
    "--gx": `${tilt.gx.toFixed(1)}%`,
    "--gy": `${tilt.gy.toFixed(1)}%`,
  } as CSSProperties;

  return (
    <motion.div
      ref={ref}
      className={cn("dash-mag", className)}
      data-accent={accent}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        delay: prefersReducedMotion ? 0 : 0.05 * index,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="dash-mag-face">{children}</div>
    </motion.div>
  );
}
