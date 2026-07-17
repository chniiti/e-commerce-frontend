import { apiClient } from "@/lib/api/client";
import { unwrapApiResponse } from "@/lib/api/utils";
import type {
  AdjustStockRequest,
  ApiResponse,
  PagedResponse,
  StockAdjustmentLog,
  StockItem,
} from "@/lib/types";

export async function getStock(
  page = 0,
  size = 20,
): Promise<PagedResponse<StockItem>> {
  const { data } = await apiClient.get<ApiResponse<PagedResponse<StockItem>>>(
    "/api/stock",
    { params: { page, size } },
  );

  return unwrapApiResponse(data);
}

export async function getStockDetail(variantId: number): Promise<StockItem> {
  const { data } = await apiClient.get<ApiResponse<StockItem>>(
    `/api/stock/${variantId}`,
  );

  return unwrapApiResponse(data);
}

export async function adjustStock(
  variantId: number,
  newQty: number,
  reason?: string,
): Promise<StockAdjustmentLog> {
  const payload: AdjustStockRequest = {
    quantity: newQty,
    reason,
  };

  const { data } = await apiClient.put<ApiResponse<StockAdjustmentLog>>(
    `/api/stock/${variantId}`,
    payload,
  );

  return unwrapApiResponse(data);
}

export async function getLowStock(
  page = 0,
  size = 20,
): Promise<PagedResponse<StockItem>> {
  const { data } = await apiClient.get<ApiResponse<PagedResponse<StockItem>>>(
    "/api/stock/low",
    { params: { page, size } },
  );

  return unwrapApiResponse(data);
}
