import { NextResponse } from "next/server";
import { z } from "zod";
import {
  API_ROUTES,
  authUsesMockCredentials,
  getApiBaseUrl,
} from "@/lib/config";
import {
  createRegisteredUserClaims,
} from "@/lib/auth/credentials";
import { attachSessionCookies } from "@/lib/auth/cookies";
import { signSession } from "@/lib/auth/jwt";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters"),
  name: z.string().min(1).max(120),
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
      { detail: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (authUsesMockCredentials()) {
    const claims = createRegisteredUserClaims(
      parsed.data.email,
      parsed.data.name,
    );
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

  const url = new URL(API_ROUTES.authRegister, getApiBaseUrl());
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Registration service unreachable" },
      { status: 503 },
    );
  }

  if (!upstream.ok) {
    let err: unknown;
    try {
      err = await upstream.json();
    } catch {
      err = { detail: await upstream.text() };
    }
    return NextResponse.json(err, { status: upstream.status });
  }

  let data: {
    access_token?: string;
    user?: {
      id: string;
      email: string;
      name?: string;
      role?: string;
      tenant_id: string;
      onboarding_completed?: boolean;
    };
  };
  try {
    data = (await upstream.json()) as typeof data;
  } catch {
    return NextResponse.json(
      { detail: "Invalid response from registration service" },
      { status: 502 },
    );
  }

  if (!data.access_token || !data.user?.id) {
    return NextResponse.json(
      { detail: "Unexpected registration response" },
      { status: 502 },
    );
  }

  const u = data.user;
  const claims = {
    sub: u.id,
    email: u.email,
    name: u.name ?? u.email.split("@")[0],
    role: u.role === "admin" ? "admin" as const : "staff" as const,
    tenantId: u.tenant_id,
    onboardingCompleted: u.onboarding_completed === true,
    apiAccessToken: data.access_token,
  };
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
