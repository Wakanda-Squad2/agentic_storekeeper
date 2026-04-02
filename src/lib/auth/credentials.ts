import { authUsesMockCredentials, getApiBaseUrl } from "@/lib/config";
import type { SessionClaims } from "@/lib/auth/types";

const MOCK_USERS: Record<
  string,
  { password: string; claims: Omit<SessionClaims, "apiAccessToken"> }
> = {
  "admin@demo.com": {
    password: "admin123",
    claims: {
      sub: "user_demo_admin",
      email: "admin@demo.com",
      name: "Demo Admin",
      role: "admin",
      tenantId: "demo-org",
      onboardingCompleted: true,
      organizationName: "Demo Organization",
    },
  },
  "staff@demo.com": {
    password: "staff123",
    claims: {
      sub: "user_demo_staff",
      email: "staff@demo.com",
      name: "Demo Staff",
      role: "staff",
      tenantId: "demo-org",
      onboardingCompleted: true,
      organizationName: "Demo Organization",
    },
  },
  "onboard@demo.com": {
    password: "onboard123",
    claims: {
      sub: "user_onboard",
      email: "onboard@demo.com",
      name: "Asha Onboarding",
      role: "staff",
      tenantId: "pending",
      onboardingCompleted: false,
    },
  },
};

function mockLogin(email: string, password: string): SessionClaims | null {
  const key = email.trim().toLowerCase();
  const row = MOCK_USERS[key];
  if (!row || row.password !== password) return null;
  return { ...row.claims };
}

type FastApiAuthResponse = {
  access_token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    tenant_id: string;
    onboarding_completed?: boolean;
    organization_name?: string;
  };
};

async function fastApiLogin(
  email: string,
  password: string,
): Promise<SessionClaims | null> {
  const url = new URL("/api/v1/auth/login", getApiBaseUrl());
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let data: FastApiAuthResponse;
  try {
    data = (await res.json()) as FastApiAuthResponse;
  } catch {
    return null;
  }
  const token = data.access_token;
  const u = data.user;
  if (!token || !u?.id || !u.email || !u.tenant_id) return null;
  return {
    sub: u.id,
    email: u.email,
    name: u.name ?? u.email.split("@")[0] ?? "User",
    role: u.role === "admin" ? "admin" : "staff",
    tenantId: u.tenant_id,
    onboardingCompleted: u.onboarding_completed === true,
    organizationName: u.organization_name,
    apiAccessToken: token,
  };
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<SessionClaims | null> {
  if (authUsesMockCredentials()) {
    return mockLogin(email, password);
  }
  return fastApiLogin(email, password);
}

export function createRegisteredUserClaims(
  email: string,
  name: string,
): SessionClaims {
  return {
    sub: `user_${crypto.randomUUID()}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role: "admin",
    tenantId: "pending",
    onboardingCompleted: false,
  };
}

export function listDemoAccountsForUi(): { email: string; hint: string }[] {
  return [
    { email: "admin@demo.com", hint: "admin123 — full access" },
    { email: "staff@demo.com", hint: "staff123 — staff role" },
    { email: "onboard@demo.com", hint: "onboard123 — forces onboarding wizard" },
  ];
}
