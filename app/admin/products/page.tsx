"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { ProductStatusBadge } from "@/components/dashboard/ProductStatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  approveProduct,
  getManagedProducts,
  rejectProduct,
} from "@/lib/api/products";
import type { Product, ProductStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatters";
import { getApiErrorMessage } from "@/lib/utils/apiErrors";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "PENDING_APPROVAL" | ProductStatus;

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const statusParam =
    statusFilter === "all" ? undefined : (statusFilter as ProductStatus);

  const query = useQuery({
    queryKey: ["managed-products", "admin", statusFilter, page, PAGE_SIZE],
    queryFn: () => getManagedProducts(page, PAGE_SIZE, statusParam),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveProduct(id),
    onSuccess: async (product) => {
      toast.success(`${product.name} approved`);
      await queryClient.invalidateQueries({ queryKey: ["managed-products"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to approve product"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectProduct(id),
    onSuccess: async (product) => {
      toast.success(`${product.name} rejected`);
      await queryClient.invalidateQueries({ queryKey: ["managed-products"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to reject product"));
    },
  });

  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      {
        id: "name",
        header: "Product",
        cell: (row) => (
          <div>
            <Link
              href={`/admin/products/${row.id}`}
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
        header: "Actions",
        className: "text-right",
        cell: (row) => (
          <div className="flex justify-end gap-2">
            {row.status === "PENDING_APPROVAL" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    approveMutation.isPending || rejectMutation.isPending
                  }
                  onClick={() => approveMutation.mutate(row.id)}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    approveMutation.isPending || rejectMutation.isPending
                  }
                  onClick={() => rejectMutation.mutate(row.id)}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Link
                href={`/admin/products/${row.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View
              </Link>
            )}
          </div>
        ),
      },
    ],
    [approveMutation, rejectMutation],
  );

  const handleFilterChange = (next: StatusFilter) => {
    setStatusFilter(next);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review pending submissions and manage the catalog.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["PENDING_APPROVAL", "Pending"],
            ["LIVE", "Live"],
            ["REJECTED", "Rejected"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={statusFilter === value ? "default" : "outline"}
            onClick={() => handleFilterChange(value)}
          >
            {label}
          </Button>
        ))}
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
          emptyMessage="No products match this filter."
        />
      )}
    </div>
  );
}
