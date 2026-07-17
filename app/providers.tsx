"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";

import { Toaster } from "@/components/ui/sonner";
import { i18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

function StoreHydration({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  return children;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <StoreHydration>{children}</StoreHydration>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
