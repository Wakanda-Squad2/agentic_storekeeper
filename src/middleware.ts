import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, TENANT_COOKIE } from "@/lib/auth/constants";
import { verifySession } from "@/lib/auth/jwt";
import { useMockDataOnly } from "@/lib/config";

async function readSession(request: NextRequest) {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifySession(raw);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = await readSession(request);
  const mock = useMockDataOnly();

  if (pathname.startsWith("/api/bridge")) {
    if (!mock && !session) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    const tenant =
      request.cookies.get(TENANT_COOKIE)?.value ??
      session?.tenantId ??
      "demo-org";
    const headers = new Headers(request.headers);
    headers.set("x-tenant-id", tenant);
    if (session?.sub) headers.set("x-user-id", session.sub);
    return NextResponse.next({ request: { headers } });
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isOnboarding = pathname.startsWith("/onboarding");

  if (session?.onboardingCompleted && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (session && !session.onboardingCompleted && isAuthPage) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const needsUser = pathname.startsWith("/dashboard") || isOnboarding;
  if (needsUser && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/dashboard") && session && !session.onboardingCompleted) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (isOnboarding && session?.onboardingCompleted) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const tenant =
    request.cookies.get(TENANT_COOKIE)?.value ??
    session?.tenantId ??
    "demo-org";
  const headers = new Headers(request.headers);
  headers.set("x-tenant-id", tenant);
  if (session?.sub) headers.set("x-user-id", session.sub);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
    "/api/bridge/:path*",
  ],
};
