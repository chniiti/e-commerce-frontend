"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ProductStatusBadge } from "@/components/dashboard/ProductStatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  approveProduct,
  getManagedProduct,
  rejectProduct,
} from "@/lib/api/products";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { getApiErrorMessage } from "@/lib/utils/apiErrors";
import { cn } from "@/lib/utils";

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["managed-product", productId],
    queryFn: () => getManagedProduct(productId),
    enabled: Number.isFinite(productId),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveProduct(productId),
    onSuccess: async (product) => {
      toast.success(`${product.name} approved`);
      await queryClient.invalidateQueries({
        queryKey: ["managed-product", productId],
      });
      await queryClient.invalidateQueries({ queryKey: ["managed-products"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to approve product"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectProduct(productId),
    onSuccess: async (product) => {
      toast.success(`${product.name} rejected`);
      await queryClient.invalidateQueries({
        queryKey: ["managed-product", productId],
      });
      await queryClient.invalidateQueries({ queryKey: ["managed-products"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to reject product"));
    },
  });

  if (!Number.isFinite(productId)) {
    return <p className="text-sm text-destructive">Invalid product id.</p>;
  }

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading product…</p>;
  }

  if (query.isError || !query.data) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(query.error, "Product not found.")}
      </p>
    );
  }

  const product = query.data;
  const isPending = product.status === "PENDING_APPROVAL";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.slug} · {product.category}
          </p>
        </div>
        <ProductStatusBadge status={product.status} />
      </div>

      <dl className="grid gap-4 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Sell price</dt>
          <dd className="mt-0.5 font-medium">
            {formatCurrency(product.sellPrice)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Stock</dt>
          <dd className="mt-0.5 font-medium">{product.stockQty}</dd>
        </div>
        {product.launchStart ? (
          <div>
            <dt className="text-muted-foreground">Launch start</dt>
            <dd className="mt-0.5 font-medium">
              {formatDate(product.launchStart)}
            </dd>
          </div>
        ) : null}
        {product.launchEnd ? (
          <div>
            <dt className="text-muted-foreground">Launch end</dt>
            <dd className="mt-0.5 font-medium">
              {formatDate(product.launchEnd)}
            </dd>
          </div>
        ) : null}
      </dl>

      {product.description ? (
        <p className="text-sm text-muted-foreground">{product.description}</p>
      ) : null}

      {product.variants.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Variants</h2>
          <ul className="space-y-1 text-sm">
            {product.variants.map((variant) => (
              <li
                key={variant.id}
                className="flex justify-between rounded-lg border border-border px-3 py-2"
              >
                <span>
                  {variant.color ?? "Variant"} ·{" "}
                  <span className="font-mono text-xs">{variant.sku}</span>
                </span>
                <span className="tabular-nums">{variant.stockQty}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isPending ? (
          <>
            <Button
              type="button"
              disabled={approveMutation.isPending || rejectMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={approveMutation.isPending || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              Reject
            </Button>
          </>
        ) : null}
        <Link
          href="/admin/products"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Back to products
        </Link>
      </div>
    </div>
  );
}
