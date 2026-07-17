"use client";

import type { ReactNode } from "react";
import { useCallback, useRef } from "react";

interface ProductTiltProps {
  children: ReactNode;
  className?: string;
}

export function ProductTilt({ children, className }: ProductTiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    element.style.transform = `perspective(900px) rotateX(${y * -6}deg) rotateY(${x * 8}deg) scale3d(1.01, 1.01, 1.01)`;
  }, []);

  const handleLeave = useCallback(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    element.style.transform =
      "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{
        transition: "transform 180ms ease-out",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
