import type {
  ApiResponse,
  CreateProductRequest,
  PagedResponse,
  Product,
  ProductDetail,
  ProductStatus,
  UpdateProductRequest,
} from "@/lib/types";
import { apiClient } from "@/lib/api/client";
import {
  ApiError,
  API_BASE_URL,
  unwrapApiResponse,
} from "@/lib/api/utils";

const DEFAULT_REVALIDATE_SECONDS = 60;
const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

async function fetchPublicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: DEFAULT_REVALIDATE_SECONDS,
    },
  });

  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  const message =
    body?.message ?? `Failed to fetch ${path} (${response.status})`;

  if (response.status === 404 && /\/api\/products\/[^/?]+$/.test(path)) {
    throw new ProductNotFoundError(message, response.status);
  }

  if (!response.ok) {
    throw new ApiError(message, response.status);
  }

  if (!body) {
    throw new ApiError(message, response.status);
  }

  return unwrapApiResponse(body);
}

export class ProductNotFoundError extends ApiError {
  constructor(message: string, status = 404) {
    super(message, status);
    this.name = "ProductNotFoundError";
  }
}

/** Lists live products (backend returns only status = LIVE). */
export async function getProducts(
  page = 0,
  size = 20,
): Promise<PagedResponse<Product>> {
  return fetchPublicApi<PagedResponse<Product>>(
    `/api/products?page=${page}&size=${size}`,
  );
}

/**
 * TRNDQ shows one live drop at a time (a week / month / few days).
 * Prefers a product whose launch window contains "now"; otherwise the
 * newest LIVE product. Returns null when no drop is live.
 */
export async function getCurrentDrop(): Promise<ProductDetail | null> {
  const page = await getProducts(0, 20);
  const candidates = page.content;
  if (candidates.length === 0) {
    return null;
  }

  const now = Date.now();

  const inWindow = candidates.find((product) => {
    const start = product.launchStart
      ? new Date(product.launchStart).getTime()
      : null;
    const end = product.launchEnd
      ? new Date(product.launchEnd).getTime()
      : null;

    if (start !== null && !Number.isNaN(start) && now < start) {
      return false;
    }
    if (end !== null && !Number.isNaN(end) && now > end) {
      return false;
    }
    // At least one bound set, or unbounded live drop still counts.
    return true;
  });

  const selected = inWindow ?? candidates[0];
  return getProductBySlug(selected.slug);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  return fetchPublicApi<ProductDetail>(
    `/api/products/${encodeURIComponent(slug)}`,
  );
}

/** Staff list — Admin: all products; Trends Responsible: own products. */
export async function getManagedProducts(
  page = 0,
  size = 20,
  status?: ProductStatus,
): Promise<PagedResponse<Product>> {
  const { data } = await apiClient.get<ApiResponse<PagedResponse<Product>>>(
    "/api/products/manage",
    { params: { page, size, status } },
  );
  return unwrapApiResponse(data);
}

export async function getManagedProduct(id: number): Promise<ProductDetail> {
  const { data } = await apiClient.get<ApiResponse<ProductDetail>>(
    `/api/products/manage/${id}`,
  );
  return unwrapApiResponse(data);
}

export async function createProduct(
  payload: CreateProductRequest,
): Promise<Product> {
  const { data } = await apiClient.post<ApiResponse<Product>>(
    "/api/products",
    payload,
  );
  return unwrapApiResponse(data);
}

export async function updateProduct(
  id: number,
  payload: UpdateProductRequest,
): Promise<Product> {
  const { data } = await apiClient.put<ApiResponse<Product>>(
    `/api/products/${id}`,
    payload,
  );
  return unwrapApiResponse(data);
}

export async function approveProduct(id: number): Promise<Product> {
  const { data } = await apiClient.put<ApiResponse<Product>>(
    `/api/products/${id}/approve`,
  );
  return unwrapApiResponse(data);
}

export async function rejectProduct(id: number): Promise<Product> {
  const { data } = await apiClient.put<ApiResponse<Product>>(
    `/api/products/${id}/reject`,
  );
  return unwrapApiResponse(data);
}

/**
 * Backend stores `landingPage.heroMediaUrl` as a URL string and has no
 * multipart/presigned upload endpoint yet. This validates the file and
 * returns a temporary object URL for wizard preview; submit a durable
 * public URL in `heroMediaUrl`.
 */
export async function uploadProductMedia(file: File): Promise<string> {
  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, GIF, MP4, or WebM files are allowed");
  }

  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error("Media file must be 15MB or smaller");
  }

  return URL.createObjectURL(file);
}
