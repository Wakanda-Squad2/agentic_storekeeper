export const SESSION_COOKIE = "storekeeper_session";
export const TENANT_COOKIE = "tenant_id";

/** Seconds — 7 days */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function getAuthSecret(): Uint8Array {
  let raw = process.env.AUTH_SECRET;
  if (
    process.env.NODE_ENV === "development" &&
    (!raw || raw.length < 32)
  ) {
    raw = "dev-only-storekeeper-auth-secret-min-32chars!";
  }
  if (!raw || raw.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a random string of at least 32 characters",
    );
  }
  return new TextEncoder().encode(raw);
}
