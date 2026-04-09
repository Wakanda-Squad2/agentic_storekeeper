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

/**
 * Validates against built-in demo users. Sessions are signed by this app; there is no upstream
 * `/auth/login` on the FastAPI service.
 */
export async function loginWithPassword(
  email: string,
  password: string,
): Promise<SessionClaims | null> {
  return mockLogin(email, password);
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
