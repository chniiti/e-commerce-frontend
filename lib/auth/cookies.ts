const ACCESS_TOKEN_COOKIE = "td_access_token";

export function getAccessTokenCookieName() {
  return ACCESS_TOKEN_COOKIE;
}

export function setAccessTokenCookie(token: string, maxAgeSeconds?: number) {
  if (typeof document === "undefined") {
    return;
  }

  const maxAge =
    typeof maxAgeSeconds === "number" && maxAgeSeconds > 0
      ? maxAgeSeconds
      : 60 * 60 * 24 * 7;

  document.cookie = [
    `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ].join("; ");
}

export function clearAccessTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${ACCESS_TOKEN_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
  ].join("; ");
}
