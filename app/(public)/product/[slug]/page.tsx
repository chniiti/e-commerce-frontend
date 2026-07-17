import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductExperience } from "@/components/public/ProductExperience";
import {
  getProductBySlug,
  ProductNotFoundError,
} from "@/lib/api/products";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    return {
      title: `${product.name} | TRNDQ`,
      description:
        product.description ?? `Reserve ${product.name} with 48-hour delivery.`,
    };
  } catch {
    return {
      title: "Product | TRNDQ",    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product;

  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <ProductExperience product={product} />
    </div>
  );
}
