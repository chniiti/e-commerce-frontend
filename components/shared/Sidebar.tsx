"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

export interface SidebarNavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

interface SidebarProps {
  titleKey: string;
  items: SidebarNavItem[];
  open?: boolean;
  onNavigate?: () => void;
}

function formatDohaTime(locale: string) {
  return new Intl.DateTimeFormat(locale.startsWith("ar") ? "ar-QA" : "en-GB", {
    timeZone: "Asia/Qatar",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function Sidebar({
  titleKey,
  items,
  open = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [dohaTime, setDohaTime] = useState(() =>
    formatDohaTime(i18n.language || "en"),
  );

  useEffect(() => {
    const tick = () => setDohaTime(formatDohaTime(i18n.language || "en"));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [i18n.language]);

  return (
    <aside className="dash-sidebar" data-open={open ? "true" : "false"}>
      <div className="dash-sidebar-brand">
        <Link href="/" className="dash-logo">
          TRN<span>DQ</span>
        </Link>
        <p className="dash-sidebar-kicker">{t(titleKey)}</p>
        <div className="dash-sidebar-meta">
          <span className="dash-live-dot" />
          <span className="dash-live-label">{t("signalLive")}</span>
        </div>
      </div>

      <nav className="dash-nav">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const idx = String(index + 1).padStart(2, "0");

          return (
            <motion.div
              key={item.href}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, x: i18n.language?.startsWith("ar") ? 12 : -12 }
              }
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.045 * index,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={item.href}
                className="dash-nav-link"
                data-active={isActive ? "true" : "false"}
                onClick={onNavigate}
              >
                <span className="dash-nav-index">{idx}</span>
                <span className="dash-nav-icon">
                  <Icon className="size-4" strokeWidth={1.7} />
                </span>
                {t(item.labelKey)}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="dash-sidebar-foot">
        <div className="dash-foot-line">
          <span className="dash-foot-label">{t("dohaTime")}</span>
          <span className="dash-foot-value">{dohaTime}</span>
        </div>
      </div>
    </aside>
  );
}
