import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { verifySession } from "@/lib/auth/jwt";

/**
 * Headers for proxying to FastAPI: tenant (from middleware / cookie) and optional Bearer from session.
 */
export async function bridgeUpstreamHeaders(
  request: NextRequest,
): Promise<Headers> {
  const h = new Headers();
  const tenant =
    request.headers.get("x-tenant-id") ??
    request.cookies.get("tenant_id")?.value ??
    "demo-org";
  h.set("x-tenant-id", tenant);

  const fromClient = request.headers.get("authorization");
  if (fromClient) {
    h.set("authorization", fromClient);
    return h;
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;
  if (session?.apiAccessToken) {
    h.set("authorization", `Bearer ${session.apiAccessToken}`);
  }
  return h;
}
