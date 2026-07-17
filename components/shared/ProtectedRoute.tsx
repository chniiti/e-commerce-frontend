"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/stores/authStore";
import type { UserRole } from "@/lib/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const [ready, setReady] = useState(false);
  const allowedRolesKey = allowedRoles.join(",");

  useEffect(() => {
    let cancelled = false;
    const roles = allowedRolesKey.split(",") as UserRole[];

    async function checkAccess() {
      await useAuthStore.getState().hydrate();
      if (cancelled) {
        return;
      }

      const currentRole = useAuthStore.getState().role;

      if (!currentRole || !roles.includes(currentRole)) {
        router.replace("/login");
        return;
      }

      setReady(true);
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [allowedRolesKey, router]);

  if (!ready || !role || !allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  return children;
}
