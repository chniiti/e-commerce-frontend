"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adjustStock, getLowStock, getStock } from "@/lib/api/stock";
import type { ApiResponse, StockItem } from "@/lib/types";
import { LOW_STOCK_THRESHOLD } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type StockFilter = "all" | "low";

const adjustStockSchema = z.object({
  quantity: z
    .number({ error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(500, "Reason must be 500 characters or fewer"),
});

type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    if (payload?.message) {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to adjust stock. Please try again.";
}

function stockStatus(qty: number): {
  label: string;
  variant: "secondary" | "destructive" | "outline";
} {
  if (qty <= 0) {
    return { label: "Out of stock", variant: "destructive" };
  }
  if (qty < LOW_STOCK_THRESHOLD) {
    return { label: "Low stock", variant: "destructive" };
  }
  return { label: "In stock", variant: "secondary" };
}

function formatProductStatus(status: StockItem["productStatus"]): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface AdjustStockDialogProps {
  item: StockItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AdjustStockDialog({
  item,
  open,
  onOpenChange,
}: AdjustStockDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    values: {
      quantity: item?.stockQty ?? 0,
      reason: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AdjustStockFormValues) => {
      if (!item) {
        throw new Error("No stock item selected");
      }
      return adjustStock(item.variantId, values.quantity, values.reason);
    },
    onSuccess: async (log) => {
      toast.success("Stock adjusted", {
        description: `${log.previousQty} → ${log.newQty}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["stock"] });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {item
              ? `${item.productName}${item.color ? ` · ${item.color}` : ""} (${item.sku})`
              : "Update the quantity for this variant."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              New quantity
            </label>
            <Input
              id="quantity"
              type="number"
              min={0}
              step={1}
              aria-invalid={Boolean(errors.quantity)}
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity ? (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason
            </label>
            <Input
              id="reason"
              placeholder="e.g. Restock from warehouse"
              aria-invalid={Boolean(errors.reason)}
              {...register("reason")}
            />
            {errors.reason ? (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            ) : null}
          </div>

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={isSubmitting || mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending || !item}
            >
              {mutation.isPending ? "Saving…" : "Save adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StockTable() {
  const [filter, setFilter] = useState<StockFilter>("all");
  const [page, setPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const query = useQuery({
    queryKey: ["stock", filter, page, PAGE_SIZE],
    queryFn: () =>
      filter === "low"
        ? getLowStock(page, PAGE_SIZE)
        : getStock(page, PAGE_SIZE),
  });

  const columns = useMemo<DataTableColumn<StockItem>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.productName}</p>
            <p className="text-xs text-muted-foreground">
              {formatProductStatus(row.productStatus)}
            </p>
          </div>
        ),
      },
      {
        id: "variant",
        header: "Variant / Color",
        cell: (row) => row.color ?? "—",
      },
      {
        id: "sku",
        header: "SKU",
        cell: (row) => <span className="font-mono text-xs">{row.sku}</span>,
      },
      {
        id: "stock",
        header: "Stock",
        cell: (row) => (
          <span
            className={cn(
              "font-mono text-sm font-medium tabular-nums",
              row.stockQty < LOW_STOCK_THRESHOLD && "text-molten",
            )}
          >
            {row.stockQty}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => {
          const status = stockStatus(row.stockQty);
          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        className: "text-right",
        cell: (row) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedItem(row);
                setDialogOpen(true);
              }}
            >
              Adjust
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const handleFilterChange = (nextFilter: StockFilter) => {
    setFilter(nextFilter);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => handleFilterChange("all")}
        >
          All stock
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "low" ? "default" : "outline"}
          onClick={() => handleFilterChange("low")}
        >
          Low stock
        </Button>
      </div>

      {query.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getErrorMessage(query.error)}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={query.data?.content ?? []}
          getRowId={(row) => row.variantId}
          page={page}
          totalPages={query.data?.totalPages ?? 0}
          totalElements={query.data?.totalElements ?? 0}
          onPageChange={setPage}
          isLoading={query.isLoading || query.isFetching}
          emptyMessage={
            filter === "low"
              ? "No low-stock variants right now."
              : "No stock items found."
          }
          rowClassName={(row) =>
            row.stockQty < LOW_STOCK_THRESHOLD
              ? "border-l-2 border-l-molten bg-molten/5 hover:bg-molten/10"
              : undefined
          }
        />
      )}

      <AdjustStockDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedItem(null);
          }
        }}
      />
    </div>
  );
}
