import { apiClient } from "@/lib/api/client";
import { unwrapApiResponse } from "@/lib/api/utils";
import type { ApiResponse, AuditLogEntry, PagedResponse } from "@/lib/types";

export async function getAuditLog(
  page = 0,
  size = 20,
): Promise<PagedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get<
    ApiResponse<PagedResponse<AuditLogEntry>>
  >("/api/audit-logs", { params: { page, size } });
  return unwrapApiResponse(data);
}
