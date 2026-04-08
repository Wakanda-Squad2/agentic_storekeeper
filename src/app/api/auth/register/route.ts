import { NextResponse } from "next/server";
import { z } from "zod";
import { createRegisteredUserClaims } from "@/lib/auth/credentials";
import { attachSessionCookies } from "@/lib/auth/cookies";
import { signSession } from "@/lib/auth/jwt";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters"),
  name: z.string().min(1).max(120),
});

/** Creates a local session only; FastAPI has no registration endpoint. */
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
      { detail: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const claims = createRegisteredUserClaims(parsed.data.email, parsed.data.name);
  let token: string;
  try {
    token = await signSession(claims);
  } catch {
    return NextResponse.json(
      { detail: "Server configuration error (check AUTH_SECRET)." },
      { status: 500 },
    );
  }
  const res = NextResponse.json(
    {
      user: {
        email: claims.email,
        name: claims.name,
        role: claims.role,
        tenantId: claims.tenantId,
        onboardingCompleted: claims.onboardingCompleted,
      },
    },
    { status: 201 },
  );
  attachSessionCookies(res, token, claims.tenantId);
  return res;
}
