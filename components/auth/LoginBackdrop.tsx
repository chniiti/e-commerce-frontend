"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Soft ambient field — cursor light + drifting brand washes. No HUD / particles. */
export function LoginBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      root.style.setProperty("--lx", `${x}%`);
      root.style.setProperty("--ly", `${y}%`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="login-backdrop"
      aria-hidden
      style={{ "--lx": "50%", "--ly": "40%" } as CSSProperties}
    >
      <div className="login-mesh login-mesh-a" />
      <div className="login-mesh login-mesh-b" />
      <div className="login-mesh login-mesh-c" />
      <div className="login-cursor-light" />
      <div className="login-noise" />
    </div>
  );
}
