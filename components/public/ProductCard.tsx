import Link from "next/link";

import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatters";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group glass-panel flex flex-col overflow-hidden rounded-2xl transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5"
    >
      <div className="relative flex aspect-[4/5] items-end overflow-hidden p-5">
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-[color-mix(in_srgb,var(--molten)_12%,transparent)]"
          aria-hidden
        />
        <div className="relative z-10 space-y-2">
          <p className="font-mono text-[10px] tracking-[0.16em] text-[var(--cyan)] uppercase">
            Live drop
          </p>
          <div className="font-display text-5xl font-bold text-[var(--molten)]">
            {product.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-[var(--border-token)] p-4">
        <p className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
          {product.category}
        </p>
        <h2 className="line-clamp-2 font-display text-lg font-semibold text-[var(--text)] group-hover:text-[var(--molten)]">
          {product.name}
        </h2>
        {product.description ? (
          <p className="line-clamp-2 text-sm text-[var(--text-muted)]">
            {product.description}
          </p>
        ) : null}
        <p className="instrument-readout mt-auto text-xl font-semibold text-[var(--molten)]">
          {formatCurrency(product.sellPrice)}
        </p>
      </div>
    </Link>
  );
}
