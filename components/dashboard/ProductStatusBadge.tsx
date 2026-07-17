import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/lib/types";

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  LIVE: "Live",
  PEAK: "Peak",
  DECLINING: "Declining",
  ARCHIVED: "Archived",
  REJECTED: "Rejected",
};

function badgeVariant(
  status: ProductStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "LIVE":
    case "PEAK":
      return "default";
    case "PENDING_APPROVAL":
      return "outline";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
  }
}

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return (
    <Badge variant={badgeVariant(status)}>{STATUS_LABELS[status]}</Badge>
  );
}
