import { apiClient } from "@/lib/api/client";
import { unwrapApiResponse } from "@/lib/api/utils";
import type {
  ApiResponse,
  Campaign,
  CreateCampaignRequest,
  PagedResponse,
} from "@/lib/types";

export async function getCampaigns(
  page = 0,
  size = 20,
): Promise<PagedResponse<Campaign>> {
  const { data } = await apiClient.get<ApiResponse<PagedResponse<Campaign>>>(
    "/api/campaigns",
    { params: { page, size } },
  );
  return unwrapApiResponse(data);
}

export async function createCampaign(
  payload: CreateCampaignRequest,
): Promise<Campaign> {
  const { data } = await apiClient.post<ApiResponse<Campaign>>(
    "/api/campaigns",
    payload,
  );
  return unwrapApiResponse(data);
}

export async function updateCampaign(
  id: number,
  payload: CreateCampaignRequest,
): Promise<Campaign> {
  const { data } = await apiClient.put<ApiResponse<Campaign>>(
    `/api/campaigns/${id}`,
    payload,
  );
  return unwrapApiResponse(data);
}
