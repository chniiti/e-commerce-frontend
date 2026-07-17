"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import type { StageVariant } from "@/components/public/VariantSelector";

interface ProductStageProps {
  variants: StageVariant[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCycle: () => void;
  onOpenZoom: () => void;
}

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ProductStage({
  variants,
  selectedId,
  onCycle,
  onOpenZoom,
}: ProductStageProps) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  const pointerDown = useCallback((clientX: number, clientY: number) => {
    draggingRef.current = true;
    hasDraggedRef.current = false;
    startRef.current = { x: clientX, y: clientY };
    rotatorRef.current?.classList.add("paused");
  }, []);

  const pointerMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current || !tiltRef.current) {
      return;
    }

    const dx = clientX - startRef.current.x;
    const dy = clientY - startRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasDraggedRef.current = true;
    }

    const rotY = Math.max(-35, Math.min(35, dx * 0.35));
    const rotX = Math.max(-18, Math.min(18, -dy * 0.25));
    tiltRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    tiltRef.current.style.filter = `brightness(${1 + Math.abs(rotY) / 220})`;
  }, []);

  const pointerUp = useCallback(() => {
    if (!draggingRef.current) {
      return;
    }
    draggingRef.current = false;

    if (tiltRef.current) {
      tiltRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
      tiltRef.current.style.filter = "brightness(1)";
    }

    window.setTimeout(() => {
      rotatorRef.current?.classList.remove("paused");
    }, 300);

    if (!hasDraggedRef.current) {
      onCycle();
    }
  }, [onCycle]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) =>
      pointerMove(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches[0]) {
        pointerMove(event.touches[0].clientX, event.touches[0].clientY);
      }
    };
    const onUp = () => pointerUp();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [pointerMove, pointerUp]);

  return (
    <div
      className="td-stage"
      onMouseDown={(event) => pointerDown(event.clientX, event.clientY)}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (touch) {
          pointerDown(touch.clientX, touch.clientY);
        }
      }}
    >
      <div className="td-spotlight" aria-hidden />
      <div className="td-reflection" aria-hidden />

      <div
        ref={rotatorRef}
        className={reducedMotion ? "td-rotator paused" : "td-rotator"}
      >
        <div ref={tiltRef} className="td-tilt-inner">
          <div className="td-photo-stack">
            {variants.map((variant, index) => (
              <div
                key={variant.id}
                className={`td-product-photo${selectedId === variant.id ? " active" : ""}`}
              >
                <Image
                  src={variant.imageUrl}
                  alt={variant.name}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 860px) 70vw, 280px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {!reducedMotion ? (
        <div className="td-particles" aria-hidden>
          {Array.from({ length: 16 }).map((_, index) => (
            <div
              key={index}
              className="td-particle"
              style={{
                left: `${(index * 6.25 + (index % 3) * 4) % 100}%`,
                bottom: "20px",
                animationDuration: `${5 + (index % 5)}s`,
                animationDelay: `${(index % 5) * 0.8}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className="absolute right-3.5 bottom-3.5 z-5 flex size-10 items-center justify-center rounded-full border border-[var(--border-token)] bg-[var(--surface)] shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition-transform duration-150 hover:scale-[1.08]"
        aria-label="Zoom product"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onOpenZoom();
        }}
      >
        <span className="relative size-3.5 rounded-full border-2 border-[var(--text)] after:absolute after:right-[-2px] after:bottom-[-7px] after:h-2 after:w-0.5 after:rotate-45 after:rounded-sm after:bg-[var(--text)] after:content-['']" />
      </button>
    </div>
  );
}
