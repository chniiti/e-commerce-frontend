import type { ApiResponse } from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Assert success for void endpoints (`ApiResponse<null>`). */
export function assertApiResponseSuccess(
  response: ApiResponse<unknown>,
): void {
  if (!response.success) {
    throw new ApiError(response.message ?? "Unexpected API response");
  }
}

/** Unwrap data-bearing responses — rejects null/undefined data. */
export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  assertApiResponseSuccess(response);

  if (response.data === undefined || response.data === null) {
    throw new ApiError(response.message ?? "Unexpected API response");
  }

  return response.data;
}
