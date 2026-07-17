"use client";

import type { ReactNode } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  ScrollText,
  Users,
  Warehouse,
} from "lucide-react";

import { DashboardShell } from "@/components/shared/DashboardShell";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import type { SidebarNavItem } from "@/components/shared/Sidebar";
import { useOrderNotifications } from "@/lib/websocket";

const adminNavItems: SidebarNavItem[] = [
  { href: "/admin/dashboard", labelKey: "navDashboard", icon: LayoutDashboard },
  { href: "/admin/users", labelKey: "navUsers", icon: Users },
  { href: "/admin/products", labelKey: "navProducts", icon: Package },
  { href: "/admin/stock", labelKey: "navStock", icon: Warehouse },
  { href: "/admin/orders", labelKey: "navOrders", icon: ClipboardList },
  { href: "/admin/audit-log", labelKey: "navAuditLog", icon: ScrollText },
];

function AdminDashboard({ children }: { children: ReactNode }) {
  useOrderNotifications({ connect: true });

  return (
    <DashboardShell
      titleKey="adminWorkspace"
      navTitleKey="adminDashboard"
      items={adminNavItems}
    >
      {children}
    </DashboardShell>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminDashboard>{children}</AdminDashboard>
    </ProtectedRoute>
  );
}
