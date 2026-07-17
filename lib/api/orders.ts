import { apiClient, publicApiClient } from "@/lib/api/client";
import { unwrapApiResponse } from "@/lib/api/utils";
import type {
  ApiResponse,
  CreateOrderRequest,
  Order,
  OrderStatus,
  OrderTrackingResponse,
  PagedResponse,
  PaymentInitResponse,
  UpdateOrderStatusRequest,
} from "@/lib/types";

export async function createOrder(
  data: CreateOrderRequest,
): Promise<PaymentInitResponse> {
  const { data: response } = await publicApiClient.post<
    ApiResponse<PaymentInitResponse>
  >("/api/orders", data);

  return unwrapApiResponse(response);
}

export async function getOrderTracking(
  trackingId: string,
): Promise<OrderTrackingResponse> {
  const { data: response } = await publicApiClient.get<
    ApiResponse<OrderTrackingResponse>
  >(`/api/orders/track/${encodeURIComponent(trackingId)}`);

  return unwrapApiResponse(response);
}

export async function getOrders(
  page = 0,
  size = 20,
  productId?: number,
): Promise<PagedResponse<Order>> {
  const { data } = await apiClient.get<ApiResponse<PagedResponse<Order>>>(
    "/api/orders",
    { params: { page, size, productId } },
  );
  return unwrapApiResponse(data);
}

export async function updateOrderStatus(
  id: number,
  orderStatus: OrderStatus,
): Promise<Order> {
  const payload: UpdateOrderStatusRequest = { orderStatus };
  const { data } = await apiClient.put<ApiResponse<Order>>(
    `/api/orders/${id}/status`,
    payload,
  );
  return unwrapApiResponse(data);
}
