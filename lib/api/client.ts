import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { refreshToken as refreshAccessToken } from "@/lib/api/auth";
import { API_BASE_URL } from "@/lib/api/utils";
import { useAuthStore } from "@/lib/stores/authStore";

const baseURL = API_BASE_URL;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

function isAuthEndpoint(url?: string) {
  if (!url) {
    return false;
  }

  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/register")
  );
}

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Unauthenticated client for public storefront endpoints */
export const publicApiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const currentRefreshToken = useAuthStore.getState().refreshToken;

    if (!currentRefreshToken) {
      if (useAuthStore.getState().accessToken) {
        useAuthStore.getState().logout();
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    try {
      const auth = await refreshAccessToken(currentRefreshToken);
      useAuthStore.getState().setAuth(auth);

      originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);
