"use client";

import type { ReactNode } from "react";
import {
  ClipboardList,
  FlaskConical,
  Megaphone,
  Package,
  Warehouse,
} from "lucide-react";

import { DashboardShell } from "@/components/shared/DashboardShell";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import type { SidebarNavItem } from "@/components/shared/Sidebar";
import { useOrderNotifications } from "@/lib/websocket";

const trendsNavItems: SidebarNavItem[] = [
  { href: "/trends/research", labelKey: "navResearch", icon: FlaskConical },
  { href: "/trends/products", labelKey: "navProducts", icon: Package },
  { href: "/trends/stock", labelKey: "navStock", icon: Warehouse },
  { href: "/trends/campaigns", labelKey: "navCampaigns", icon: Megaphone },
  { href: "/trends/orders", labelKey: "navOrders", icon: ClipboardList },
];

function TrendsDashboard({ children }: { children: ReactNode }) {
  useOrderNotifications({ connect: true });

  return (
    <DashboardShell
      titleKey="trendsWorkspace"
      navTitleKey="trendsDashboard"
      items={trendsNavItems}
    >
      {children}
    </DashboardShell>
  );
}

export default function TrendsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={["TRENDS_RESPONSIBLE", "ADMIN"]}>
      <TrendsDashboard>{children}</TrendsDashboard>
    </ProtectedRoute>
  );
}
