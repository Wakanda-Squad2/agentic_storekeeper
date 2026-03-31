import { SignJWT, jwtVerify } from "jose";
import { SESSION_MAX_AGE, getAuthSecret } from "@/lib/auth/constants";
import type { SessionClaims } from "@/lib/auth/types";

const ISS = "storekeeper:web";

export async function signSession(claims: SessionClaims): Promise<string> {
  let secret: Uint8Array;
  try {
    secret = getAuthSecret();
  } catch {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new SignJWT({
    email: claims.email,
    name: claims.name,
    role: claims.role,
    tenantId: claims.tenantId,
    onboardingCompleted: claims.onboardingCompleted,
    organizationName: claims.organizationName,
    apiAccessToken: claims.apiAccessToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISS)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySession(
  token: string,
): Promise<SessionClaims | null> {
  let secret: Uint8Array;
  try {
    secret = getAuthSecret();
  } catch {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISS });
    const email = payload.email;
    const tenantId = payload.tenantId;
    if (typeof email !== "string" || typeof tenantId !== "string") return null;
    const onboardingCompleted = payload.onboardingCompleted === true;
    const name = typeof payload.name === "string" ? payload.name : "";
    return {
      sub: String(payload.sub ?? ""),
      email,
      name,
      role: payload.role === "staff" ? "staff" : "admin",
      tenantId,
      onboardingCompleted,
      organizationName:
        typeof payload.organizationName === "string"
          ? payload.organizationName
          : undefined,
      apiAccessToken:
        typeof payload.apiAccessToken === "string"
          ? payload.apiAccessToken
          : undefined,
    };
  } catch {
    return null;
  }
}
