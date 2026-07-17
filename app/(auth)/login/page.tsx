"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, Moon, Sun } from "lucide-react";
import { z } from "zod";

import { LoginBackdrop } from "@/components/auth/LoginBackdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
import { useAuthStore } from "@/lib/stores/authStore";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { ApiResponse } from "@/lib/types";

import "./login.css";

const loginSchema = z.object({
  email: z.email("invalidEmail"),
  password: z.string().min(1, "passwordRequired"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type Language = "en" | "ar";

const panelTransition = {
  layout: {
    type: "spring" as const,
    stiffness: 88,
    damping: 20,
    mass: 0.95,
  },
};

function getApiErrorMessage(error: unknown): string | null {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    if (payload?.message) {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const language: Language = i18n.language?.startsWith("ar") ? "ar" : "en";
  const isRtl = language === "ar";
  const layoutEnabled = !prefersReducedMotion;

  const setLanguage = useCallback(
    (next: Language) => {
      void i18n.changeLanguage(next);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    },
    [i18n],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const auth = await login(values.email, values.password);

      if (auth.role === "ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }

      if (auth.role === "TRENDS_RESPONSIBLE") {
        router.replace("/trends/research");
        return;
      }

      setFormError(t("noDashboardAccess"));
    } catch (error) {
      setFormError(getApiErrorMessage(error) ?? t("genericError"));
    }
  });

  return (
    <LayoutGroup id="login-layout">
      <main className="login-page" data-lang={language} dir="ltr">
        <div className="login-switchers" dir={isRtl ? "rtl" : "ltr"}>
          <div className="login-theme-switcher" aria-label="Language">
            <button
              type="button"
              className="login-theme-button"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className="login-theme-button"
              aria-pressed={language === "ar"}
              onClick={() => setLanguage("ar")}
            >
              عربي
            </button>
          </div>

          <div className="login-theme-switcher" aria-label="Appearance">
            <button
              type="button"
              className="login-theme-button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <Sun className="size-3.5" strokeWidth={1.8} />
              {t("light")}
            </button>
            <button
              type="button"
              className="login-theme-button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <Moon className="size-3.5" strokeWidth={1.8} />
              {t("night")}
            </button>
          </div>
        </div>

        <motion.aside
          className="login-visual"
          aria-label="TRNDQ"
          layout={layoutEnabled}
          transition={panelTransition}
        >
          <Image
            src="/e-commerce.webp"
            alt=""
            fill
            priority
            quality={92}
            sizes="(max-width: 960px) 100vw, 52vw"
            className="login-visual-image"
          />
          <div className="login-visual-shade" aria-hidden />
          <div className="login-visual-content">
            <Link href="/" className="login-mark login-mark-on-media">
              TRN<span>DQ</span>
            </Link>
          </div>
        </motion.aside>

        <motion.section
          className="login-side"
          dir={isRtl ? "rtl" : "ltr"}
          layout={layoutEnabled}
          transition={panelTransition}
        >
          <LoginBackdrop />

          <div className="login-frame">
            <motion.div
              key={language}
              className="login-card"
              aria-labelledby="login-heading"
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0.4, y: 12, filter: "blur(5px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.48,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1,
              }}
            >
              <div className="login-card-accent" aria-hidden />

              <div className="login-card-top">
                <div className="login-card-meta">
                  <span className="login-live-dot" aria-hidden />
                  <span>{t("staffWorkspace")}</span>
                </div>
                <h1 id="login-heading" className="login-heading">
                  {t("signIn")}
                </h1>
              </div>

              <form className="login-form" onSubmit={onSubmit} noValidate>
                <div className="login-field">
                  <label htmlFor="email">{t("email")}</label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("emailPlaceholder")}
                    className="login-input"
                    dir="ltr"
                    aria-invalid={Boolean(errors.email)}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="login-hint-error">{t("invalidEmail")}</p>
                  ) : null}
                </div>

                <div className="login-field">
                  <label htmlFor="password">{t("password")}</label>
                  <div className="login-password">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t("passwordPlaceholder")}
                      className="login-input"
                      dir="ltr"
                      aria-invalid={Boolean(errors.password)}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="login-reveal"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" strokeWidth={1.75} />
                      ) : (
                        <Eye className="size-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="login-hint-error">{t("passwordRequired")}</p>
                  ) : null}
                </div>

                {formError ? (
                  <p className="login-alert" role="alert">
                    {formError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="login-cta"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("signingIn")}
                    </>
                  ) : (
                    <>
                      {t("signIn")}
                      <span className="login-cta-arrow" aria-hidden>
                        {isRtl ? "←" : "→"}
                      </span>
                    </>
                  )}
                </Button>
              </form>

              <div className="login-card-bottom">
                <div className="login-role-chips">
                  <span>{t("admin")}</span>
                  <span>{t("trends")}</span>
                </div>
                <Link href="/" className="login-storefront">
                  {t("storefront")}
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </LayoutGroup>
  );
}
