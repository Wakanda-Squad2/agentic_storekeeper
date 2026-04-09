import type { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  TENANT_COOKIE,
} from "@/lib/auth/constants";

/** `Secure` cookies are not stored over plain http. Set AUTH_INSECURE_COOKIES=true for `next start` on http:// or LAN IP without TLS. */
const secure =
  process.env.NODE_ENV === "production" &&
  process.env.AUTH_INSECURE_COOKIES !== "true";

export function attachSessionCookies(
  res: NextResponse,
  sessionToken: string,
  tenantId: string,
) {
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  res.cookies.set(TENANT_COOKIE, tenantId, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(TENANT_COOKIE, "", {
    httpOnly: false,
    secure,
    path: "/",
    maxAge: 0,
  });
}
