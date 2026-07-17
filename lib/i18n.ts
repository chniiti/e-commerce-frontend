import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const LANGUAGE_STORAGE_KEY = "td-lang";

const resources = {
  en: {
    translation: {
      staffWorkspace: "Staff workspace",
      signIn: "Sign in",
      email: "Email",
      emailPlaceholder: "name@company.com",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      signingIn: "Signing in…",
      admin: "Admin",
      trends: "Trends",
      storefront: "Storefront",
      tagline: "Trend reservation · Qatar",
      light: "Light",
      night: "Night",
      showPassword: "Show password",
      hidePassword: "Hide password",
      invalidEmail: "Enter a valid email address",
      passwordRequired: "Password is required",
      noDashboardAccess: "This account cannot access the dashboard.",
      genericError: "Unable to sign in. Please try again.",
      logout: "Log out",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      orderNotifications: "Order notifications",
      orderAlerts: "Order alerts",
      noNewOrders: "No new orders yet.",
      signalLive: "Signal live",
      dohaTime: "Doha",
      opsConsole: "Ops console",
      displayControls: "Display controls",
      language: "Language",
      appearance: "Appearance",
      signedIn: "Signed in",
      adminWorkspace: "Admin",
      adminDashboard: "Admin dashboard",
      trendsWorkspace: "Trends",
      trendsDashboard: "Trends dashboard",
      navDashboard: "Dashboard",
      navUsers: "Users",
      navProducts: "Products",
      navStock: "Stock",
      navOrders: "Orders",
      navAuditLog: "Audit log",
      navResearch: "Trend research",
      navCampaigns: "Campaigns",
      dashOverview: "Command center",
      dashCommandKicker: "TRNDQ · Qatar",
      dashSubtitle:
        "Live reservation economics — revenue heat, conversion signal, SLA integrity.",
      dashTotalRevenue: "Total revenue",
      dashActiveTrends: "Active trends",
      dashConversion: "Conversion rate",
      dashSla: "SLA compliance",
      dashRevenueOverTime: "Revenue over time",
      dashOrdersByStatus: "Orders by status",
      dashCampaignsByPlatform: "Campaigns by platform",
      dashOrderMix: "Order mix",
      dashNoData: "No data available yet.",
      dashChartsNote:
        "KPI cards come from /api/dashboard. Charts are derived from recent orders and campaigns.",
      dashLiveFeed: "Live feed",
      dashTelemetry: "Telemetry",
    },
  },
  ar: {
    translation: {
      staffWorkspace: "مساحة عمل الموظفين",
      signIn: "تسجيل الدخول",
      email: "البريد الإلكتروني",
      emailPlaceholder: "name@company.com",
      password: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      signingIn: "جارٍ تسجيل الدخول…",
      admin: "مشرف",
      trends: "الترندات",
      storefront: "المتجر",
      tagline: "حجز الترندات · قطر",
      light: "فاتح",
      night: "داكن",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      invalidEmail: "أدخل بريدًا إلكترونيًا صحيحًا",
      passwordRequired: "كلمة المرور مطلوبة",
      noDashboardAccess: "هذا الحساب لا يملك صلاحية الوصول إلى لوحة التحكم.",
      genericError: "تعذّر تسجيل الدخول. حاول مرة أخرى.",
      logout: "تسجيل الخروج",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      orderNotifications: "إشعارات الطلبات",
      orderAlerts: "تنبيهات الطلبات",
      noNewOrders: "لا توجد طلبات جديدة بعد.",
      signalLive: "إشارة مباشرة",
      dohaTime: "الدوحة",
      opsConsole: "وحدة العمليات",
      displayControls: "إعدادات العرض",
      language: "اللغة",
      appearance: "المظهر",
      signedIn: "مسجّل الدخول",
      adminWorkspace: "المشرف",
      adminDashboard: "لوحة تحكم المشرف",
      trendsWorkspace: "الترندات",
      trendsDashboard: "لوحة تحكم الترندات",
      navDashboard: "لوحة التحكم",
      navUsers: "المستخدمون",
      navProducts: "المنتجات",
      navStock: "المخزون",
      navOrders: "الطلبات",
      navAuditLog: "سجل التدقيق",
      navResearch: "بحث الترندات",
      navCampaigns: "الحملات",
      dashOverview: "مركز القيادة",
      dashCommandKicker: "TRNDQ · قطر",
      dashSubtitle:
        "اقتصاد الحجوزات المباشر — حرارة الإيرادات، إشارة التحويل، سلامة اتفاقية الخدمة.",
      dashTotalRevenue: "إجمالي الإيرادات",
      dashActiveTrends: "ترندات نشطة",
      dashConversion: "معدل التحويل",
      dashSla: "الالتزام باتفاقية الخدمة",
      dashRevenueOverTime: "الإيرادات عبر الزمن",
      dashOrdersByStatus: "الطلبات حسب الحالة",
      dashCampaignsByPlatform: "الحملات حسب المنصة",
      dashOrderMix: "توزيع الطلبات",
      dashNoData: "لا توجد بيانات بعد.",
      dashChartsNote:
        "بطاقات المؤشرات من /api/dashboard. الرسوم مستمدة من الطلبات والحملات الأخيرة.",
      dashLiveFeed: "بث مباشر",
      dashTelemetry: "قياسات",
    },
  },
};

function readStoredLanguage(): "en" | "ar" {
  if (typeof window === "undefined") {
    return "en";
  }
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "ar"
    ? "ar"
    : "en";
}

function applyDocumentLanguage(lng: string) {
  if (typeof document === "undefined") {
    return;
  }
  const isArabic = lng === "ar";
  document.documentElement.lang = isArabic ? "ar" : "en";
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: readStoredLanguage(),
    fallbackLng: "en",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
  });
} else {
  // Hot reload / already-initialized: replace empty bundles from earlier boot.
  for (const [lng, bundle] of Object.entries(resources)) {
    i18n.addResourceBundle(lng, "translation", bundle.translation, true, true);
  }
}

i18n.on("languageChanged", applyDocumentLanguage);
applyDocumentLanguage(i18n.language || "en");

export { i18n };
