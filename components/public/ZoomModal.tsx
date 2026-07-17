"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { StageVariant } from "@/components/public/VariantSelector";
import { formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface ZoomModalProps {
  open: boolean;
  onClose: () => void;
  variants: StageVariant[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  price: number;
  onBuy: () => void;
  buyDisabled?: boolean;
  /** Bump to remount and reset zoom/pan state when opened. */
  sessionKey?: number;
}

function ZoomCanvas({
  variants,
  selectedId,
  onSelect,
  price,
  onBuy,
  buyDisabled,
  onClose,
}: Omit<ZoomModalProps, "open" | "sessionKey">) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });

  const active =
    variants.find((variant) => variant.id === selectedId) ?? variants[0];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    setScale((current) => {
      const next = Math.max(1, Math.min(2.6, current - event.deltaY * 0.0015));
      if (next === 1) {
        setOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current) {
        return;
      }
      setOffset({
        x: event.clientX - startRef.current.x,
        y: event.clientY - startRef.current.y,
      });
    };

    const onUp = () => {
      draggingRef.current = false;
      modalRef.current?.classList.remove("dragging");
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  if (!active) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      className={cn(
        "relative h-[min(560px,78vh)] w-[min(560px,88vw)] overflow-hidden rounded-[20px] border border-[var(--border-token)] bg-[var(--surface)]",
        scale > 1 ? "cursor-grab" : "cursor-zoom-in",
      )}
      onWheel={onWheel}
      onClick={() => {
        if (scale === 1) {
          setScale(1.8);
        }
      }}
      onMouseDown={(event) => {
        if (scale <= 1) {
          return;
        }
        draggingRef.current = true;
        startRef.current = {
          x: event.clientX - offset.x,
          y: event.clientY - offset.y,
        };
        modalRef.current?.classList.add("dragging");
      }}
    >
      <button
        type="button"
        className="absolute top-3.5 right-3.5 z-5 flex size-9 items-center justify-center rounded-full border border-[var(--border-token)] bg-[var(--surface-2)] text-[var(--text)]"
        onClick={onClose}
        aria-label="Close zoom"
      >
        ×
      </button>

      <div className="absolute top-3.5 left-3.5 z-5 flex gap-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            className={cn(
              "size-6 rounded-full border-2 shadow-sm transition-transform duration-150",
              selectedId === variant.id
                ? "scale-110 border-[var(--molten)]"
                : "border-transparent",
            )}
            style={{ backgroundColor: variant.swatchHex }}
            aria-label={variant.name}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(variant.id);
            }}
          />
        ))}
      </div>

      <div className="absolute top-3.5 left-1/2 z-5 -translate-x-1/2 whitespace-nowrap rounded-[20px] border border-[var(--border-token)] bg-[var(--surface-2)] px-3.5 py-1.5 font-mono text-[11px] text-[var(--text-muted)]">
        Scroll or pinch to zoom · drag to pan
      </div>

      <div
        className="absolute inset-x-0 top-0 bottom-16 transition-transform duration-[120ms] ease-out"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div className="relative mx-auto mt-14 h-[calc(100%-3.5rem)] w-[85%]">
          <Image
            src={active.imageUrl}
            alt={active.name}
            fill
            sizes="560px"
            className="rounded-xl object-contain"
            priority
          />
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-[6] flex items-center justify-between border-t border-[var(--border-token)] bg-[var(--surface)] px-4 py-3.5">
        <span className="font-mono text-[15px] font-bold text-[var(--molten)]">
          {formatCurrency(price)}
        </span>
        <button
          type="button"
          className="td-buy-btn !px-6 !py-2.5 !text-[13px]"
          disabled={buyDisabled}
          onClick={(event) => {
            event.stopPropagation();
            onBuy();
          }}
        >
          Buy now
        </button>
      </div>
    </div>
  );
}

export function ZoomModal({
  open,
  onClose,
  variants,
  selectedId,
  onSelect,
  price,
  onBuy,
  buyDisabled,
  sessionKey = 0,
}: ZoomModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/78 backdrop-blur-[6px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <ZoomCanvas
        key={sessionKey}
        variants={variants}
        selectedId={selectedId}
        onSelect={onSelect}
        price={price}
        onBuy={onBuy}
        buyDisabled={buyDisabled}
        onClose={onClose}
      />
    </div>
  );
}
