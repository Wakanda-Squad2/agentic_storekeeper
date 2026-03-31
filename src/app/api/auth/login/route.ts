import { NextResponse } from "next/server";
import { z } from "zod";
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
    return NextResponse.json(
      { detail: "Invalid email or password" },
      { status: 401 },
    );
  }

  const token = await signSession(claims);
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
