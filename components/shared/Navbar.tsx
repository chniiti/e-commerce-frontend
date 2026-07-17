"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LogOut, Menu, Moon, Sun } from "lucide-react";

import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import { useTheme } from "@/lib/theme/ThemeProvider";

interface NavbarProps {
  titleKey: string;
  onMenuClick?: () => void;
}

type Language = "en" | "ar";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function Navbar({ titleKey, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const language: Language = i18n.language?.startsWith("ar") ? "ar" : "en";

  const setLanguage = useCallback(
    (next: Language) => {
      void i18n.changeLanguage(next);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    },
    [i18n],
  );

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="dash-topbar">
      <div className="dash-topbar-left">
        <button
          type="button"
          className="dash-menu-btn"
          aria-label={t("openMenu")}
          onClick={onMenuClick}
        >
          <Menu className="size-4" strokeWidth={1.8} />
        </button>
        <div className="dash-title-stack">
          <span className="dash-title-eyebrow">{t("opsConsole")}</span>
          <h1 className="dash-page-title">{t(titleKey)}</h1>
        </div>
      </div>

      <div className="dash-topbar-actions">
        <div className="dash-controls" role="group" aria-label={t("displayControls")}>
          <div className="dash-seg" role="group" aria-label={t("language")}>
            <button
              type="button"
              className="dash-seg-btn"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className="dash-seg-btn"
              aria-pressed={language === "ar"}
              aria-label="العربية"
              onClick={() => setLanguage("ar")}
            >
              ع
            </button>
          </div>

          <span className="dash-controls-rule" aria-hidden />

          <div className="dash-seg" role="group" aria-label={t("appearance")}>
            <button
              type="button"
              className="dash-seg-btn"
              aria-pressed={theme === "light"}
              aria-label={t("light")}
              onClick={() => setTheme("light")}
            >
              <Sun className="size-3.5" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className="dash-seg-btn"
              aria-pressed={theme === "dark"}
              aria-label={t("night")}
              onClick={() => setTheme("dark")}
            >
              <Moon className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <span className="dash-topbar-divider" aria-hidden />

        <div className="dash-account">
          {user?.email ? (
            <div className="dash-identity" title={user.email}>
              <span className="dash-avatar" aria-hidden>
                {initialsFromEmail(user.email)}
              </span>
              <span className="dash-identity-text">
                <span className="dash-identity-label">{t("signedIn")}</span>
                <span className="dash-identity-email">{user.email}</span>
              </span>
            </div>
          ) : null}

          <NotificationBell />

          <button
            type="button"
            className="dash-logout"
            onClick={handleLogout}
            aria-label={t("logout")}
          >
            <LogOut className="size-3.5" strokeWidth={1.8} />
            <span>{t("logout")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
