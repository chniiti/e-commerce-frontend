import { apiClient } from "@/lib/api/client";
import { unwrapApiResponse } from "@/lib/api/utils";
import type {
  ApiResponse,
  CreateUserRequest,
  PagedResponse,
  UpdateRoleRequest,
  User,
  UserRole,
} from "@/lib/types";

/** ADMIN only. */
export async function getUsers(
  page = 0,
  size = 20,
): Promise<PagedResponse<User>> {
  const { data } = await apiClient.get<ApiResponse<PagedResponse<User>>>(
    "/api/users",
    { params: { page, size } },
  );
  return unwrapApiResponse(data);
}

/** ADMIN only. */
export async function getUser(id: number): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>(`/api/users/${id}`);
  return unwrapApiResponse(data);
}

/** ADMIN only. */
export async function createUser(payload: CreateUserRequest): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<User>>(
    "/api/users",
    payload,
  );
  return unwrapApiResponse(data);
}

export async function updateUserRole(
  id: number,
  role: UserRole,
): Promise<User> {
  const payload: UpdateRoleRequest = { role };
  const { data } = await apiClient.put<ApiResponse<User>>(
    `/api/users/${id}/role`,
    payload,
  );
  return unwrapApiResponse(data);
}

export async function suspendUser(id: number): Promise<User> {
  const { data } = await apiClient.put<ApiResponse<User>>(
    `/api/users/${id}/suspend`,
  );
  return unwrapApiResponse(data);
}

export async function activateUser(id: number): Promise<User> {
  const { data } = await apiClient.put<ApiResponse<User>>(
    `/api/users/${id}/activate`,
  );
  return unwrapApiResponse(data);
}
