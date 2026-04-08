export type UserRole = "admin" | "staff";

/** JWT / session claims (private — includes apiAccessToken when using FastAPI tokens). */
export type SessionClaims = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  onboardingCompleted: boolean;
  organizationName?: string;
  /** Optional upstream Bearer token — forwarded on bridge when present (mock auth has none). */
  apiAccessToken?: string;
};

/** Safe subset for client / `GET /api/auth/me`. */
export type PublicSession = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  onboardingCompleted: boolean;
  organizationName?: string;
};

export function toPublicSession(claims: SessionClaims): PublicSession {
  return {
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    role: claims.role,
    tenantId: claims.tenantId,
    onboardingCompleted: claims.onboardingCompleted,
    organizationName: claims.organizationName,
  };
}
