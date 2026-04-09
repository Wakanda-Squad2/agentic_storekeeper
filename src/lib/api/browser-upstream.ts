import { getApiBaseUrl } from "@/lib/config";
import { joinUrl } from "@/lib/api/storekeeper/http";

/** Active tenant for FastAPI (non–http-only cookie set by `useTenantStore`). */
export function getBrowserTenantId(): string {
  if (typeof document === "undefined") return "demo-org";
  const match = document.cookie.match(/(?:^|; )tenant_id=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "demo-org";
}

export function browserUpstreamHeaders(base?: HeadersInit): Headers {
  const headers = base ? new Headers(base) : new Headers();
  if (!headers.has("x-tenant-id")) {
    headers.set("x-tenant-id", getBrowserTenantId());
  }
  return headers;
}

export function apiAbsoluteUrl(path: string): string {
  return joinUrl(getApiBaseUrl(), path);
}
