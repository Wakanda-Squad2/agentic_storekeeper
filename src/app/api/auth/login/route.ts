import { NextResponse } from "next/server";
import { z } from "zod";
import { authUsesMockCredentials } from "@/lib/config";
import { loginWithPassword } from "@/lib/auth/credentials";
import { attachSessionCookies } from "@/lib/auth/cookies";
import { signSession } from "@/lib/auth/jwt";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "Invalid credentials payload" },
      { status: 400 },
    );
  }

  const claims = await loginWithPassword(
    parsed.data.email,
    parsed.data.password,
  );
  if (!claims) {
    const detail = authUsesMockCredentials()
      ? "Invalid email or password"
      : "Invalid email or password, or API unreachable. Demo accounts only work when mock auth is on — set STOREKEEPER_AUTH_MOCK=true (or NEXT_PUBLIC_USE_MOCK_DATA=true), restart, and use admin@demo.com / admin123.";
    return NextResponse.json({ detail }, { status: 401 });
  }

  let token: string;
  try {
    token = await signSession(claims);
  } catch {
    return NextResponse.json(
      { detail: "Server configuration error (check AUTH_SECRET in production)." },
      { status: 500 },
    );
  }
  const res = NextResponse.json({
    user: {
      email: claims.email,
      name: claims.name,
      role: claims.role,
      tenantId: claims.tenantId,
      onboardingCompleted: claims.onboardingCompleted,
    },
  });
  attachSessionCookies(res, token, claims.tenantId);
  return res;
}
