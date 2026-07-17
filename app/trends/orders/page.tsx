"use client";

import { Suspense } from "react";

import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { Skeleton } from "@/components/ui/skeleton";

function OrdersFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function TrendsOrdersPage() {
  return (
    <Suspense fallback={<OrdersFallback />}>
      <OrdersTable
        title="Orders"
        description="Orders for your products only."
      />
    </Suspense>
  );
}
