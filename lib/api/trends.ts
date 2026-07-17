import { apiClient } from "@/lib/api/client";
import {
  assertApiResponseSuccess,
  unwrapApiResponse,
} from "@/lib/api/utils";
import type {
  ApiResponse,
  CreateTrendResearchRequest,
  PagedResponse,
  TrendResearch,
} from "@/lib/types";

export async function getTrendResearch(
  page = 0,
  size = 20,
): Promise<PagedResponse<TrendResearch>> {
  const { data } = await apiClient.get<
    ApiResponse<PagedResponse<TrendResearch>>
  >("/api/trends-research", { params: { page, size } });
  return unwrapApiResponse(data);
}

export async function getTrendResearchById(id: number): Promise<TrendResearch> {
  const { data } = await apiClient.get<ApiResponse<TrendResearch>>(
    `/api/trends-research/${id}`,
  );
  return unwrapApiResponse(data);
}

export async function createTrendResearch(
  payload: CreateTrendResearchRequest,
): Promise<TrendResearch> {
  const { data } = await apiClient.post<ApiResponse<TrendResearch>>(
    "/api/trends-research",
    payload,
  );
  return unwrapApiResponse(data);
}

export async function updateTrendResearch(
  id: number,
  payload: CreateTrendResearchRequest,
): Promise<TrendResearch> {
  const { data } = await apiClient.put<ApiResponse<TrendResearch>>(
    `/api/trends-research/${id}`,
    payload,
  );
  return unwrapApiResponse(data);
}

export async function deleteTrendResearch(id: number): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<null>>(
    `/api/trends-research/${id}`,
  );
  assertApiResponseSuccess(data);
}
