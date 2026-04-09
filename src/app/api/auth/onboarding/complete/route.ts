import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { attachSessionCookies } from "@/lib/auth/cookies";
import { signSession, verifySession } from "@/lib/auth/jwt";

const bodySchema = z.object({
  organizationName: z.string().min(2).max(200),
  tenantSlug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, hyphens"),
});

export async function POST(request: NextRequest) {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const session = await verifySession(raw);
  if (!session) {
    return NextResponse.json({ detail: "Invalid session" }, { status: 401 });
  }
  if (session.onboardingCompleted) {
    return NextResponse.json({ detail: "Already completed" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const next = {
    ...session,
    tenantId: parsed.data.tenantSlug,
    organizationName: parsed.data.organizationName.trim(),
    onboardingCompleted: true,
  };
  const token = await signSession(next);
  const res = NextResponse.json({
    user: {
      email: next.email,
      name: next.name,
      role: next.role,
      tenantId: next.tenantId,
      onboardingCompleted: true,
      organizationName: next.organizationName,
    },
  });
  attachSessionCookies(res, token, next.tenantId);
  return res;
}
