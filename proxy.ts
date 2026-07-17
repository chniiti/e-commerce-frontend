import { NextResponse, type NextRequest } from "next/server";

import { getAccessTokenCookieName } from "@/lib/auth/cookies";
import { getRoleFromAccessToken } from "@/lib/auth/jwt";

function loginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Edge protection for dashboard routes (Next.js 16 `proxy.ts` replaces
 * the deprecated `middleware.ts` convention).
 *
 * - /admin/*  → ADMIN only
 * - /trends/* → TRENDS_RESPONSIBLE or ADMIN
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(getAccessTokenCookieName())?.value;
  const role = token ? getRoleFromAccessToken(decodeURIComponent(token)) : null;

  if (!role) {
    return loginRedirect(request);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return loginRedirect(request);
  }

  if (
    pathname.startsWith("/trends") &&
    role !== "TRENDS_RESPONSIBLE" &&
    role !== "ADMIN"
  ) {
    return loginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/trends", "/trends/:path*"],
};
