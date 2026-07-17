"use client";

import { useEffect, useState, type RefObject } from "react";

import { formatCurrency } from "@/lib/utils/formatters";

interface StickyBuyBarProps {
  productName: string;
  price: number;
  observeRef: RefObject<HTMLElement | null>;
  disabled?: boolean;
  onBuy: () => void;
}

export function StickyBuyBar({
  productName,
  price,
  observeRef,
  disabled,
  onBuy,
}: StickyBuyBarProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const target = observeRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShow(!entry.isIntersecting);
        });
      },
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [observeRef]);

  return (
    <div className={`td-sticky-buy${show ? " show" : ""}`}>
      <div className="flex flex-col">
        <span className="text-[13px] font-medium text-[var(--text)]">
          {productName}
        </span>
        <span className="font-mono text-[13px] font-bold text-[var(--molten)]">
          {formatCurrency(price)}
        </span>
      </div>
      <button
        type="button"
        className="td-buy-btn !px-7 !py-[11px] !text-sm"
        disabled={disabled}
        onClick={onBuy}
      >
        Buy now
      </button>
    </div>
  );
}
