"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrderNotifications } from "@/lib/websocket";
import { formatRelativeTime } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

function ordersHrefForPath(pathname: string, orderId: number): string {
  const base = pathname.startsWith("/trends") ? "/trends/orders" : "/admin/orders";
  return `${base}?highlight=${orderId}`;
}

export function NotificationBell() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { notifications, unreadCount, connectionStatus, markAsRead } =
    useOrderNotifications();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 1200);
      prevUnreadRef.current = unreadCount;
      return () => window.clearTimeout(timer);
    }

    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("orderNotifications")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "relative text-muted-foreground hover:text-foreground",
          pulse && "control-pulse",
        )}
      >
        <Bell />
        <span
          className={cn(
            "absolute top-1 start-1 size-1.5 rounded-full",
            connectionStatus === "connected"
              ? "bg-signal-cyan shadow-[0_0_6px_rgb(63_217_232/0.8)]"
              : connectionStatus === "connecting"
                ? "bg-molten animate-pulse"
                : "bg-muted-foreground/50",
          )}
          title={`WebSocket: ${connectionStatus}`}
        />
        {unreadCount > 0 ? (
          <Badge className="absolute -top-1 -end-1 h-4 min-w-4 justify-center rounded-full border-0 bg-signal-cyan px-1 font-mono text-[10px] leading-none text-void">
            {badgeLabel}
          </Badge>
        ) : null}
      </Button>

      {open ? (
        <div
          role="menu"
          className="glass-panel-strong absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-foreground">
              {t("orderAlerts")}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-signal-cyan capitalize">
              {connectionStatus}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t("noNewOrders")}
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <Link
                      href={ordersHrefForPath(pathname, notification.orderId)}
                      role="menuitem"
                      className={cn(
                        "block px-3 py-3 text-start transition-colors duration-150 hover:bg-muted/60",
                        !notification.read && "bg-signal-cyan/5",
                      )}
                      onClick={() => {
                        markAsRead(notification.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {notification.productName}
                          {notification.variant
                            ? ` · ${notification.variant}`
                            : ""}
                        </p>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {formatRelativeTime(notification.receivedAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {notification.deliveryLocation}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {notification.customerName} · {notification.phone}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
