import { isAxiosError } from "axios";

import { ApiError } from "@/lib/api/utils";
import type { ApiResponse } from "@/lib/types";

export function getApiErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) {
    return error.status;
  }

  if (isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  if (isAxiosError(error)) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    if (payload?.message) {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function toIsoDateTime(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function generateVariantSku(color: string, index: number): string {
  const slug = (color || "variant")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12);

  const suffix = Date.now().toString(36).toUpperCase().slice(-4);
  return `SKU-${slug || "VAR"}-${index + 1}-${suffix}`;
}
