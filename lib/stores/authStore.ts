import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { login as loginRequest } from "@/lib/api/auth";
import {
  clearAccessTokenCookie,
  setAccessTokenCookie,
} from "@/lib/auth/cookies";
import type { AuthResponse, AuthUser, UserRole } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  hydrate: () => Promise<void>;
  setAuth: (auth: AuthResponse) => void;
}

function toAuthUser(auth: AuthResponse): AuthUser {
  return {
    email: auth.email,
    role: auth.role,
  };
}

function applyAuth(
  set: (partial: Partial<AuthState>) => void,
  auth: AuthResponse,
) {
  setAccessTokenCookie(auth.accessToken, auth.expiresIn);
  set({
    user: toAuthUser(auth),
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    role: auth.role,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: null,

      setAuth: (auth) => {
        applyAuth(set, auth);
      },

      login: async (email, password) => {
        const auth = await loginRequest(email, password);
        applyAuth(set, auth);
        return auth;
      },

      logout: () => {
        clearAccessTokenCookie();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          role: null,
        });
      },

      hydrate: async () => {
        await useAuthStore.persist.rehydrate();
        const { accessToken } = get();
        if (accessToken) {
          setAccessTokenCookie(accessToken);
        } else {
          clearAccessTokenCookie();
        }
      },
    }),
    {
      name: "trenddrop-auth",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        role: state.role,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAccessTokenCookie(state.accessToken);
        }
      },
    },
  ),
);
