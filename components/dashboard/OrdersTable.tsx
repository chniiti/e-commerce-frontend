"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import {
  getNextOrderStatuses,
  OrderStatusBadge,
} from "@/components/dashboard/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { getOrders, updateOrderStatus } from "@/lib/api/orders";
import { getManagedProducts } from "@/lib/api/products";
import type { Order, OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatters";
import { getApiErrorMessage } from "@/lib/utils/apiErrors";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

interface OrdersTableProps {
  title: string;
  description: string;
}

export function OrdersTable({ title, description }: OrdersTableProps) {
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");
  const highlightId = highlightParam ? Number(highlightParam) : null;

  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const ordersQuery = useQuery({
    queryKey: ["orders", page, PAGE_SIZE],
    queryFn: () => getOrders(page, PAGE_SIZE),
  });

  const productsQuery = useQuery({
    queryKey: ["managed-products", "order-names"],
    queryFn: () => getManagedProducts(0, 100),
  });

  const productNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const product of productsQuery.data?.content ?? []) {
      map.set(product.id, product.name);
    }
    return map;
  }, [productsQuery.data?.content]);

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      orderStatus,
    }: {
      id: number;
      orderStatus: OrderStatus;
    }) => updateOrderStatus(id, orderStatus),
    onSuccess: async (order) => {
      toast.success(`Order #${order.id} updated`);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update order status"));
    },
  });

  const columns = useMemo<DataTableColumn<Order>[]>(
    () => [
      {
        id: "customer",
        header: "Customer",
        cell: (row) => (
          <div>
            <p className="font-medium">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{row.phone}</p>
          </div>
        ),
      },
      {
        id: "product",
        header: "Product",
        cell: (row) =>
          productNames.get(row.productId) ?? `Product #${row.productId}`,
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <OrderStatusBadge status={row.orderStatus} />,
      },
      {
        id: "delivery",
        header: "Delivery",
        cell: (row) => (
          <span className="block max-w-[180px] truncate">
            {row.deliveryLocation}
          </span>
        ),
      },
      {
        id: "created",
        header: "Created",
        cell: (row) => formatDate(row.createdAt),
      },
      {
        id: "actions",
        header: "Update",
        className: "text-right",
        cell: (row) => {
          const nextStatuses = getNextOrderStatuses(row.orderStatus);
          if (nextStatuses.length === 0) {
            return (
              <span className="text-xs text-muted-foreground">Final</span>
            );
          }

          return (
            <select
              className="h-8 max-w-[160px] rounded-lg border border-input bg-transparent px-2 text-sm"
              defaultValue=""
              disabled={statusMutation.isPending}
              onChange={(event) => {
                const value = event.target.value as OrderStatus;
                if (!value) {
                  return;
                }
                statusMutation.mutate({ id: row.id, orderStatus: value });
                event.target.value = "";
              }}
            >
              <option value="">Change status</option>
              {nextStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          );
        },
      },
    ],
    [productNames, statusMutation],
  );

  const highlightOnPage = Boolean(
    highlightId &&
      ordersQuery.data?.content.some((order) => order.id === highlightId),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {highlightId && Number.isFinite(highlightId) ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
          <span>
            Highlighting order <span className="font-mono">#{highlightId}</span>
          </span>
          {!highlightOnPage && !ordersQuery.isLoading ? (
            <span className="text-muted-foreground">
              (not on this page — try another page)
            </span>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("highlight");
              window.history.replaceState({}, "", url.toString());
            }}
          >
            Clear
          </Button>
        </div>
      ) : null}

      {ordersQuery.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(ordersQuery.error)}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={ordersQuery.data?.content ?? []}
          getRowId={(row) => row.id}
          page={page}
          totalPages={ordersQuery.data?.totalPages ?? 0}
          totalElements={ordersQuery.data?.totalElements ?? 0}
          onPageChange={setPage}
          isLoading={ordersQuery.isLoading || ordersQuery.isFetching}
          emptyMessage="No orders yet."
          rowClassName={(row) =>
            cn(
              highlightId === row.id &&
                "bg-primary/10 ring-1 ring-inset ring-primary/30",
            )
          }
        />
      )}
    </div>
  );
}
