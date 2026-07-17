"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { ProductStatusBadge } from "@/components/dashboard/ProductStatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { getManagedProducts } from "@/lib/api/products";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatters";
import { getApiErrorMessage } from "@/lib/utils/apiErrors";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const columns: DataTableColumn<Product>[] = [
  {
    id: "name",
    header: "Product",
    cell: (row) => (
      <div>
        <Link
          href={`/trends/products/${row.id}/edit`}
          className="font-medium hover:underline"
        >
          {row.name}
        </Link>
        <p className="text-xs text-muted-foreground">{row.category}</p>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <ProductStatusBadge status={row.status} />,
  },
  {
    id: "price",
    header: "Price",
    cell: (row) => formatCurrency(row.sellPrice),
  },
  {
    id: "stock",
    header: "Stock",
    cell: (row) => row.stockQty,
  },
  {
    id: "actions",
    header: "",
    className: "text-right",
    cell: (row) => (
      <div className="flex justify-end">
        <Link
          href={`/trends/products/${row.id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Edit
        </Link>
      </div>
    ),
  },
];

export default function TrendsProductsPage() {
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ["managed-products", "trends", page, PAGE_SIZE],
    queryFn: () => getManagedProducts(page, PAGE_SIZE),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Products you created, including those awaiting approval.
          </p>
        </div>
        <Link
          href="/trends/products/new"
          className={cn(buttonVariants())}
        >
          <Plus className="size-4" />
          New product
        </Link>
      </div>

      {query.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(query.error)}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={query.data?.content ?? []}
          getRowId={(row) => row.id}
          page={page}
          totalPages={query.data?.totalPages ?? 0}
          totalElements={query.data?.totalElements ?? 0}
          onPageChange={setPage}
          isLoading={query.isLoading || query.isFetching}
          emptyMessage="No products yet. Create your first drop."
        />
      )}
    </div>
  );
}
