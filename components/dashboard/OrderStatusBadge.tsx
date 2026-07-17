import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  RESERVED: "Reserved",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function badgeVariant(
  status: OrderStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DELIVERED":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "OUT_FOR_DELIVERY":
    case "PROCESSING":
      return "outline";
    default:
      return "secondary";
  }
}

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant={badgeVariant(status)}>{STATUS_LABELS[status]}</Badge>
  );
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

/** Next statuses allowed by the backend transition rules. */
export function getNextOrderStatuses(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case "RESERVED":
      return ["CONFIRMED", "CANCELLED"];
    case "CONFIRMED":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      return ["OUT_FOR_DELIVERY", "CANCELLED"];
    case "OUT_FOR_DELIVERY":
      return ["DELIVERED", "CANCELLED"];
    default:
      return [];
  }
}
