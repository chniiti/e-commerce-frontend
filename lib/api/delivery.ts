import { apiClient, publicApiClient } from "@/lib/api/client";
import { unwrapApiResponse } from "@/lib/api/utils";
import type {
  ApiResponse,
  DeliveryTracking,
  UpdateDeliveryRequest,
} from "@/lib/types";

/** PUBLIC — looks up delivery state using the order tracking UUID. */
export async function getDeliveryTracking(
  trackingId: string,
): Promise<DeliveryTracking> {
  const { data } = await publicApiClient.get<ApiResponse<DeliveryTracking>>(
    `/api/delivery/track/${encodeURIComponent(trackingId)}`,
  );
  return unwrapApiResponse(data);
}

/** ADMIN or TRENDS_RESPONSIBLE. */
export async function updateDelivery(
  payload: UpdateDeliveryRequest,
): Promise<DeliveryTracking> {
  const { data } = await apiClient.put<ApiResponse<DeliveryTracking>>(
    "/api/delivery",
    payload,
  );
  return unwrapApiResponse(data);
}
