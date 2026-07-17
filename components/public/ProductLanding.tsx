"use client";

import { ProductExperience } from "@/components/public/ProductExperience";
import type { ProductDetail } from "@/lib/types";

interface ProductLandingProps {
  product: ProductDetail;
}

/** @deprecated Prefer ProductExperience — kept as a thin alias for existing imports. */
export function ProductLanding({ product }: ProductLandingProps) {
  return <ProductExperience product={product} />;
}
