"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DropReveal } from "@/components/public/DropReveal";
import { Button } from "@/components/ui/button";
import type { LandingPage } from "@/lib/types";
import {
  parseProductMedia,
  type ProductMediaItem,
} from "@/lib/utils/productMedia";
import { cn } from "@/lib/utils";

const ProductTilt = dynamic(
  () =>
    import("@/components/public/ProductTilt").then((mod) => mod.ProductTilt),
  { ssr: false },
);

interface ProductMediaViewerProps {
  landingPage: LandingPage | null;
  productName: string;
}

function MediaSlide({
  item,
  productName,
  priority,
}: {
  item: ProductMediaItem;
  productName: string;
  priority?: boolean;
}) {
  if (item.type === "video") {
    return (
      <video
        className="h-full w-full object-cover"
        src={item.url}
        controls
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <Image
      src={item.url}
      alt={item.alt ?? productName}
      fill
      priority={priority}
      sizes="(max-width: 1024px) 100vw, 55vw"
      className="object-cover"
    />
  );
}

export function ProductMediaViewer({
  landingPage,
  productName,
}: ProductMediaViewerProps) {
  const media = parseProductMedia(landingPage, productName);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tiltReady, setTiltReady] = useState(false);

  if (media.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-border bg-graphite text-slate">
        No media available
      </div>
    );
  }

  const activeItem = media[activeIndex];
  const hasMultiple = media.length > 1;

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? media.length - 1 : current - 1,
    );
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === media.length - 1 ? 0 : current + 1,
    );
  };

  const hero = (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-graphite">
      <MediaSlide
        item={activeItem}
        productName={productName}
        priority={activeIndex === 0}
      />

      {hasMultiple ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute top-1/2 left-3 -translate-y-1/2 border-border bg-graphite/80 backdrop-blur-sm"
            onClick={showPrevious}
            aria-label="Previous media"
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute top-1/2 right-3 -translate-y-1/2 border-border bg-graphite/80 backdrop-blur-sm"
            onClick={showNext}
            aria-label="Next media"
          >
            <ChevronRight />
          </Button>
        </>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 -z-10 spotlight-radial"
          aria-hidden
        />

        <DropReveal>
          {tiltReady ? (
            <ProductTilt>{hero}</ProductTilt>
          ) : (
            <div
              onPointerEnter={() => setTiltReady(true)}
              className="[&:hover]:cursor-default"
            >
              {hero}
            </div>
          )}
        </DropReveal>
      </div>

      {hasMultiple ? (
        <div className="flex gap-2 overflow-x-auto">
          {media.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-[box-shadow,transform] duration-150",
                index === activeIndex
                  ? "border-molten ring-2 ring-molten/30"
                  : "border-border hover:scale-[1.02]",
              )}
              aria-label={`View media ${index + 1}`}
            >
              {item.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-graphite font-mono text-[10px] text-slate">
                  VID
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={item.alt ?? `${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
