import type { Metadata } from "next";
import Link from "next/link";
import { isAxiosError } from "axios";
import { Check, PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getOrderTracking } from "@/lib/api/orders";
import type { OrderStatus, OrderTrackingResponse } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track your order | TRNDQ",
};

const TIMELINE_STEPS: ReadonlyArray<{ status: OrderStatus; label: string }> = [
  { status: "RESERVED", label: "Reserved" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

interface TrackOrderPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

function NotFoundMessage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <PackageSearch className="size-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that order
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Please double-check the tracking link from your confirmation. If you
        think this is a mistake, contact us and we&apos;ll help you out.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        Back to the store
      </Link>
    </main>
  );
}

function CancelledNotice() {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <p className="font-medium text-destructive">This order was cancelled.</p>
      <p className="mt-1 text-muted-foreground">
        If you already paid, your refund is being processed. Contact us if you
        have any questions.
      </p>
    </div>
  );
}

function StatusTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = TIMELINE_STEPS.findIndex(
    (step) => step.status === currentStatus,
  );

  return (
    <ol className="space-y-0">
      {TIMELINE_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <li key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium",
                  isCompleted || isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="size-4" /> : index + 1}
              </div>
              {!isLast ? (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-8",
                    isCompleted ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <div className="pb-8">
              <p
                className={cn(
                  "font-medium",
                  isCurrent
                    ? "text-primary"
                    : isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {isCurrent ? (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Current status
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderSummary({ order }: { order: OrderTrackingResponse }) {
  return (
    <dl className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
      {order.productName ? (
        <div>
          <dt className="text-muted-foreground">Product</dt>
          <dd className="mt-0.5 font-medium">{order.productName}</dd>
        </div>
      ) : null}
      {order.variant ? (
        <div>
          <dt className="text-muted-foreground">Variant</dt>
          <dd className="mt-0.5 font-medium">{order.variant}</dd>
        </div>
      ) : null}
      <div>
        <dt className="text-muted-foreground">Delivery location</dt>
        <dd className="mt-0.5 font-medium">{order.deliveryLocation}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Ordered</dt>
        <dd className="mt-0.5 font-medium">{formatDate(order.createdAt)}</dd>
      </div>
    </dl>
  );
}

export default async function TrackOrderPage({ params }: TrackOrderPageProps) {
  const { orderId } = await params;

  let order: OrderTrackingResponse;

  try {
    order = await getOrderTracking(orderId);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return <NotFoundMessage />;
    }

    throw error;
  }

  const isCancelled = order.orderStatus === "CANCELLED";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium text-primary">Order tracking</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {order.productName
            ? `Your ${order.productName} order`
            : "Your order"}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm text-muted-foreground">
            {order.trackingId}
          </p>
          <Badge variant="secondary">
            {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {isCancelled ? (
          <CancelledNotice />
        ) : (
          <StatusTimeline currentStatus={order.orderStatus} />
        )}

        <OrderSummary order={order} />

        <p className="text-sm text-muted-foreground">
          Last updated {formatDate(order.updatedAt)}. This page always shows
          the latest status — refresh anytime.
        </p>
      </div>
    </main>
  );
}
