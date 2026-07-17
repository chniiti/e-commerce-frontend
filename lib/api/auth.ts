import axios from "axios";

import { API_BASE_URL, unwrapApiResponse } from "@/lib/api/utils";
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from "@/lib/types";

const baseURL = API_BASE_URL;

/** PUBLIC — only the first user may self-register with the ADMIN role. */
export async function register(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  const { data } = await axios.post<ApiResponse<AuthResponse>>(
    `${baseURL}/api/auth/register`,
    payload,
  );

  return unwrapApiResponse(data);
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const payload: LoginRequest = { email, password };
  const { data } = await axios.post<ApiResponse<AuthResponse>>(
    `${baseURL}/api/auth/login`,
    payload,
  );

  return unwrapApiResponse(data);
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<AuthResponse> {
  const payload: RefreshTokenRequest = { refreshToken: refreshTokenValue };
  const { data } = await axios.post<ApiResponse<AuthResponse>>(
    `${baseURL}/api/auth/refresh`,
    payload,
  );

  return unwrapApiResponse(data);
}
