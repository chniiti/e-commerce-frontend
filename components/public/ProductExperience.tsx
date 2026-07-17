"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import { BuyNowDialog } from "@/components/public/BuyNowDialog";
import { CountdownTimer } from "@/components/public/CountdownTimer";
import { StockBar } from "@/components/public/StockBar";
import { StickyBuyBar } from "@/components/public/StickyBuyBar";
import { ThemeToggle } from "@/components/public/ThemeToggle";
import {
  VariantSelector,
  type StageVariant,
} from "@/components/public/VariantSelector";
import type { ProductDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatters";
import "@/components/public/product-landing.css";

const ProductStage = dynamic(
  () =>
    import("@/components/public/ProductStage").then((mod) => mod.ProductStage),
  {
    ssr: false,
    loading: () => (
      <div className="td-stage">
        <div className="td-spotlight" />
      </div>
    ),
  },
);

const ZoomModal = dynamic(
  () => import("@/components/public/ZoomModal").then((mod) => mod.ZoomModal),
  { ssr: false },
);

const FALLBACK_SWATCHES = [
  "#1a1a1a",
  "#a97a4b",
  "#2f4d3f",
  "#5e2530",
  "#e8e2d5",
  "#2980b9",
  "#c0392b",
];

function guessSwatch(color: string | null, index: number): string {
  if (!color) {
    return FALLBACK_SWATCHES[index % FALLBACK_SWATCHES.length];
  }

  const named: Record<string, string> = {
    black: "#1a1a1a",
    "noir black": "#1a1a1a",
    white: "#e8e2d5",
    ivory: "#e8e2d5",
    tan: "#a97a4b",
    cognac: "#a97a4b",
    "cognac tan": "#a97a4b",
    emerald: "#2f4d3f",
    green: "#2f4d3f",
    burgundy: "#5e2530",
    red: "#c0392b",
    blue: "#2980b9",
    gold: "#e8a33d",
  };

  return named[color.trim().toLowerCase()] ?? FALLBACK_SWATCHES[index % FALLBACK_SWATCHES.length];
}

function toStageVariants(product: ProductDetail): StageVariant[] {
  const hero = product.landingPage?.heroMediaUrl;
  const fallbackImage =
    hero ||
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80";

  if (product.variants.length === 0) {
    return [
      {
        id: 0,
        name: product.name,
        imageUrl: fallbackImage,
        swatchHex: "#1a1a1a",
        spinFrames: [],
      },
    ];
  }

  return product.variants.map((variant, index) => ({
    id: variant.id,
    name: variant.color ?? variant.sku,
    imageUrl: variant.imageUrl || fallbackImage,
    swatchHex: variant.swatchHex || guessSwatch(variant.color, index),
    spinFrames: variant.spinFrames ?? [],
  }));
}

interface ProductExperienceProps {
  product: ProductDetail;
}

export function ProductExperience({ product }: ProductExperienceProps) {
  const stageVariants = useMemo(() => toStageVariants(product), [product]);
  const [selectedId, setSelectedId] = useState<number | null>(
    () =>
      stageVariants.find((variant) => {
        const stock = product.variants.find((item) => item.id === variant.id);
        return !stock || stock.stockQty > 0;
      })?.id ??
      stageVariants[0]?.id ??
      null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomSession, setZoomSession] = useState(0);
  const buyButtonRef = useRef<HTMLButtonElement>(null);

  const selectedVariant = product.variants.find(
    (variant) => variant.id === selectedId,
  );

  const countdownEnd =
    product.launchEnd ?? product.landingPage?.countdownEnd ?? null;

  const currentStock = selectedVariant?.stockQty ?? product.stockQty;

  const totalStock = (() => {
    if (selectedVariant?.initialStockQty != null) {
      return selectedVariant.initialStockQty;
    }

    const sum = product.variants.reduce(
      (total, variant) => total + (variant.initialStockQty ?? variant.stockQty),
      0,
    );

    return sum > 0 ? sum : product.stockQty || currentStock || 1;
  })();

  const canReserve = useMemo(() => {
    if (product.stockQty <= 0) {
      return false;
    }
    if (product.variants.length === 0) {
      return true;
    }
    return Boolean(selectedVariant && selectedVariant.stockQty > 0);
  }, [product, selectedVariant]);

  const cycleColor = useCallback(() => {
    if (stageVariants.length === 0) {
      return;
    }
    const index = stageVariants.findIndex((variant) => variant.id === selectedId);
    const next = stageVariants[(index + 1) % stageVariants.length];
    setSelectedId(next.id);
  }, [selectedId, stageVariants]);

  const openBuy = useCallback(() => {
    if (!canReserve) {
      return;
    }
    setZoomOpen(false);
    setDialogOpen(true);
  }, [canReserve]);

  return (
    <>
      <div className="td-iris-overlay" aria-hidden />

      <nav className="relative z-10 flex items-center justify-between px-[6%] py-7">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-[1px] text-[var(--text)]"
        >
          TRN<span className="text-[var(--molten)]">DQ</span>
        </Link>
        <div className="flex items-center gap-7">
          <div className="hidden gap-8 text-sm text-[var(--text-muted)] sm:flex">
            <span>How it works</span>
            <span>Track order</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="grid min-h-[82vh] grid-cols-1 items-center gap-9 px-[6%] pt-3.5 pb-8 md:grid-cols-2">
        <div className="order-first md:order-none">
          <ProductStage
            variants={stageVariants}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCycle={cycleColor}
            onOpenZoom={() => {
              setZoomSession((current) => current + 1);
              setZoomOpen(true);
            }}
          />
        </div>

        <div>
          <div className="mb-5 inline-flex items-center gap-2 font-mono text-xs tracking-[1.5px] text-[var(--cyan)] uppercase">
            <span className="td-live-dot" />
            This drop · Doha, Qatar
            {product.category ? ` · ${product.category}` : null}
          </div>

          <h1 className="font-display mb-3 text-4xl leading-[1.02] font-bold tracking-[-1px] text-[var(--text)] md:text-[48px]">
            {product.name}
          </h1>

          {product.description ? (
            <p className="mb-[22px] max-w-[420px] text-sm leading-[1.55] text-[var(--text-muted)]">
              {product.description}
            </p>
          ) : null}

          {countdownEnd ? <CountdownTimer endTime={countdownEnd} /> : null}

          <VariantSelector
            variants={stageVariants}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-display text-[30px] font-bold text-[var(--text)]">
              {formatCurrency(product.sellPrice)}
            </span>
          </div>

          <StockBar
            current={currentStock}
            total={totalStock}
            reservedToday={product.landingPage?.urgencyCounter ?? 0}
          />

          <button
            ref={buyButtonRef}
            type="button"
            className="td-buy-btn"
            disabled={!canReserve}
            onClick={openBuy}
          >
            {canReserve ? "Buy now" : "Sold out"}
          </button>

          <div className="mt-4 flex flex-wrap gap-[18px]">
            {[
              "48h delivery in Qatar",
              "Secure payment",
              "First in GCC",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]"
              >
                <i className="inline-block size-[5px] rounded-full bg-[var(--molten)]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </main>

      <StickyBuyBar
        productName={product.name}
        price={product.sellPrice}
        observeRef={buyButtonRef}
        disabled={!canReserve}
        onBuy={openBuy}
      />

      <ZoomModal
        open={zoomOpen}
        sessionKey={zoomSession}
        onClose={() => setZoomOpen(false)}
        variants={stageVariants}
        selectedId={selectedId}
        onSelect={setSelectedId}
        price={product.sellPrice}
        onBuy={openBuy}
        buyDisabled={!canReserve}
      />

      <BuyNowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={product.id}
        variantId={
          selectedId && selectedId > 0 ? selectedId : undefined
        }
        productName={product.name}
      />
    </>
  );
}
