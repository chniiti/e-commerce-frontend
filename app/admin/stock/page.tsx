import { StockTable } from "@/components/dashboard/StockTable";

export default function AdminStockPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and adjust inventory across all products.
        </p>
      </div>
      <StockTable />
    </div>
  );
}
