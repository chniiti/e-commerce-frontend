"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MagneticCard } from "@/components/dashboard/MagneticCard";
import { getOrderStatusLabel } from "@/components/dashboard/OrderStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaigns } from "@/lib/api/campaigns";
import { getDashboardStats } from "@/lib/api/dashboard";
import { getOrders } from "@/lib/api/orders";
import type { OrderStatus } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/utils/apiErrors";
import { formatCurrency } from "@/lib/utils/formatters";

const CHART_MOLTEN = "#E8A33D";
const CHART_CYAN = "#3FD9E8";
const CHART_MOLTEN_MUTED = "#C48A2F";
const CHART_CYAN_MUTED = "#2AB8C8";

const ORDER_STATUSES: OrderStatus[] = [
  "RESERVED",
  "CONFIRMED",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

function StatCard({
  label,
  value,
  loading,
  index,
  accent,
  fill,
}: {
  label: string;
  value: string;
  loading: boolean;
  index: number;
  accent: "molten" | "cyan" | "neutral";
  fill: number;
}) {
  return (
    <MagneticCard index={index} accent={accent}>
      <div className="dash-mag-body">
        <p className="dash-kpi-label">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-28" />
        ) : (
          <p className="dash-kpi-value">{value}</p>
        )}
        <div className="dash-kpi-bar" aria-hidden>
          <span style={{ width: `${Math.min(100, Math.max(8, fill))}%` }} />
        </div>
      </div>
    </MagneticCard>
  );
}

function ChartCard({
  title,
  tag,
  loading,
  empty,
  emptyLabel,
  children,
  index,
}: {
  title: string;
  tag: string;
  loading: boolean;
  empty?: boolean;
  emptyLabel: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <MagneticCard index={index + 4} accent="neutral">
      <div className="dash-mag-body">
        <div className="dash-chart-title">
          <span>{title}</span>
          <span className="dash-chart-tag">{tag}</span>
        </div>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : empty ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          <div className="h-64 w-full">{children}</div>
        )}
      </div>
    </MagneticCard>
  );
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "dashboard-charts"],
    queryFn: () => getOrders(0, 100),
  });

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "dashboard-charts"],
    queryFn: () => getCampaigns(0, 100),
  });

  const revenueSeries = useMemo(() => {
    const orders = ordersQuery.data?.content ?? [];
    const byDay = new Map<string, number>();

    for (const order of orders) {
      if (order.orderStatus === "CANCELLED") {
        continue;
      }
      const day = order.createdAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(order.totalPrice));
    }

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));
  }, [ordersQuery.data?.content]);

  const ordersByStatus = useMemo(() => {
    const orders = ordersQuery.data?.content ?? [];
    const counts = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, 0]),
    ) as Record<OrderStatus, number>;

    for (const order of orders) {
      counts[order.orderStatus] += 1;
    }

    return ORDER_STATUSES.filter((status) => counts[status] > 0).map(
      (status) => ({
        status: getOrderStatusLabel(status),
        count: counts[status],
      }),
    );
  }, [ordersQuery.data?.content]);

  const campaignsByPlatform = useMemo(() => {
    const campaigns = campaignsQuery.data?.content ?? [];
    const counts = new Map<string, number>();

    for (const campaign of campaigns) {
      counts.set(
        campaign.platform,
        (counts.get(campaign.platform) ?? 0) + 1,
      );
    }

    return Array.from(counts.entries()).map(([platform, count]) => ({
      platform,
      count,
    }));
  }, [campaignsQuery.data?.content]);

  const chartsLoading =
    ordersQuery.isLoading ||
    ordersQuery.isFetching ||
    campaignsQuery.isLoading ||
    campaignsQuery.isFetching;

  const conversion = statsQuery.data?.conversionRate ?? 0;
  const sla = statsQuery.data?.slaCompliancePercent ?? 0;

  return (
    <div className="space-y-5">
      <motion.section
        className="dash-command"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="dash-command-kicker">{t("dashCommandKicker")}</p>
        <h1 className="dash-command-title">{t("dashOverview")}</h1>
        <p className="dash-command-sub">{t("dashSubtitle")}</p>
      </motion.section>

      {statsQuery.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(statsQuery.error)}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          accent="molten"
          label={t("dashTotalRevenue")}
          value={formatCurrency(statsQuery.data?.totalRevenue ?? 0)}
          loading={statsQuery.isLoading}
          fill={72}
        />
        <StatCard
          index={1}
          accent="cyan"
          label={t("dashActiveTrends")}
          value={String(statsQuery.data?.activeTrends ?? 0)}
          loading={statsQuery.isLoading}
          fill={Math.min(100, (statsQuery.data?.activeTrends ?? 0) * 18 + 12)}
        />
        <StatCard
          index={2}
          accent="molten"
          label={t("dashConversion")}
          value={`${conversion.toFixed(1)}%`}
          loading={statsQuery.isLoading}
          fill={conversion}
        />
        <StatCard
          index={3}
          accent="cyan"
          label={t("dashSla")}
          value={`${sla.toFixed(1)}%`}
          loading={statsQuery.isLoading}
          fill={sla}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          index={0}
          title={t("dashRevenueOverTime")}
          tag={t("dashTelemetry")}
          loading={chartsLoading}
          empty={revenueSeries.length === 0}
          emptyLabel={t("dashNoData")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.45} />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.45} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(128,128,128,0.2)",
                  background: "rgba(20,22,26,0.92)",
                  color: "#f5f3ee",
                }}
                formatter={(value) =>
                  formatCurrency(
                    typeof value === "number" ? value : Number(value),
                  )
                }
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={CHART_MOLTEN}
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 4, fill: CHART_CYAN }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          index={1}
          title={t("dashOrdersByStatus")}
          tag={t("dashLiveFeed")}
          loading={chartsLoading}
          empty={ordersByStatus.length === 0}
          emptyLabel={t("dashNoData")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordersByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} stroke="currentColor" opacity={0.45} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.45} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(128,128,128,0.2)",
                  background: "rgba(20,22,26,0.92)",
                  color: "#f5f3ee",
                }}
              />
              <Bar dataKey="count" fill={CHART_CYAN} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          index={2}
          title={t("dashCampaignsByPlatform")}
          tag={t("dashTelemetry")}
          loading={chartsLoading}
          empty={campaignsByPlatform.length === 0}
          emptyLabel={t("dashNoData")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={campaignsByPlatform}
                dataKey="count"
                nameKey="platform"
                innerRadius={52}
                outerRadius={92}
                paddingAngle={3}
                stroke="transparent"
              >
                {campaignsByPlatform.map((entry, index) => (
                  <Cell
                    key={entry.platform}
                    fill={index % 2 === 0 ? CHART_CYAN : CHART_CYAN_MUTED}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(128,128,128,0.2)",
                  background: "rgba(20,22,26,0.92)",
                  color: "#f5f3ee",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          index={3}
          title={t("dashOrderMix")}
          tag={t("dashLiveFeed")}
          loading={chartsLoading}
          empty={ordersByStatus.length === 0}
          emptyLabel={t("dashNoData")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ordersByStatus}
                dataKey="count"
                nameKey="status"
                outerRadius={92}
                paddingAngle={2}
                stroke="transparent"
              >
                {ordersByStatus.map((entry, index) => (
                  <Cell
                    key={entry.status}
                    fill={
                      index % 2 === 0 ? CHART_MOLTEN : CHART_MOLTEN_MUTED
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(128,128,128,0.2)",
                  background: "rgba(20,22,26,0.92)",
                  color: "#f5f3ee",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <p className="dash-note">{t("dashChartsNote")}</p>
    </div>
  );
}
