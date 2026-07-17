import { apiClient } from "@/lib/api/client";
import { unwrapApiResponse } from "@/lib/api/utils";
import type { ApiResponse, DashboardStats } from "@/lib/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<ApiResponse<DashboardStats>>(
    "/api/dashboard",
  );
  return unwrapApiResponse(data);
}
