"use client";

import { cn } from "@/lib/utils";

export interface StageVariant {
  id: number;
  name: string;
  imageUrl: string;
  swatchHex: string;
  spinFrames?: string[];
}

interface VariantSelectorProps {
  variants: StageVariant[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="mb-5">
      <p className="mb-2 font-mono text-[11px] tracking-[0.5px] text-[var(--text-muted)]">
        Colour — click to preview
      </p>
      <div className="flex gap-3">
        {variants.map((variant) => {
          const isActive = selectedId === variant.id;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              className={cn(
                "group relative size-[34px] rounded-full border-2 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-[transform,border-color] duration-150",
                isActive
                  ? "scale-[1.14] border-[var(--molten)]"
                  : "border-transparent hover:scale-[1.14]",
              )}
              style={{ backgroundColor: variant.swatchHex }}
              aria-label={variant.name}
              aria-pressed={isActive}
            >
              <span className="pointer-events-none absolute -top-[30px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border-token)] bg-[var(--surface)] px-2 py-0.5 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                {variant.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
