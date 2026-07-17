"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { DashAtmosphere } from "@/components/dashboard/DashAtmosphere";
import { Navbar } from "@/components/shared/Navbar";
import {
  Sidebar,
  type SidebarNavItem,
} from "@/components/shared/Sidebar";

import "@/components/dashboard/dashboard-shell.css";

interface DashboardShellProps {
  titleKey: string;
  navTitleKey: string;
  items: SidebarNavItem[];
  children: ReactNode;
}

export function DashboardShell({
  titleKey,
  navTitleKey,
  items,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { i18n, t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isRtl = i18n.language?.startsWith("ar");

  useEffect(() => {
    setMobileOpen(false);
  }, [i18n.language, pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || prefersReducedMotion) {
      return;
    }

    let frame = 0;
    let targetX = 0.5;
    let targetY = 0.4;
    let currentX = 0.5;
    let currentY = 0.4;

    const onMove = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / Math.max(rect.width, 1);
      targetY = (event.clientY - rect.top) / Math.max(rect.height, 1);
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.065;
      currentY += (targetY - currentY) * 0.065;
      shell.style.setProperty("--mx", currentX.toFixed(4));
      shell.style.setProperty("--my", currentY.toFixed(4));
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={shellRef}
      className="dash-shell"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <DashAtmosphere />

      {mobileOpen ? (
        <button
          type="button"
          className="dash-scrim"
          aria-label={t("closeMenu")}
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <Sidebar
        titleKey={titleKey}
        items={items}
        open={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="dash-main">
        <Navbar
          titleKey={navTitleKey}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="dash-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, y: 14, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                prefersReducedMotion
                  ? undefined
                  : { opacity: 0, y: -8, filter: "blur(3px)" }
              }
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
