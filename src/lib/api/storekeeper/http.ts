import { getApiBaseUrl } from "@/lib/config";
import { ApiError } from "@/lib/api/errors";
import type { HTTPValidationErrorBody } from "@/lib/api/storekeeper/types";

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function formatFastApiDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0] as HTTPValidationErrorBody["detail"][number] | undefined;
    if (first && typeof first.msg === "string") {
      const loc = Array.isArray(first.loc) ? first.loc.join(".") : "";
      return loc ? `${loc}: ${first.msg}` : first.msg;
    }
  }
  return undefined;
}

export type StorekeeperRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
};

function mergeHeaderBases(
  forward: Headers | undefined,
  fromInit: HeadersInit | undefined,
): Headers {
  const headers = forward ? new Headers(forward) : new Headers();
  if (fromInit) {
    const extra = new Headers(fromInit);
    extra.forEach((v, k) => headers.set(k, v));
  }
  return headers;
}

/**
 * Low-level JSON request to the FastAPI backend. Uses `getApiBaseUrl()` (fixed origin in config).
 * Pass `forwardHeaders` from the Next.js bridge to propagate `x-tenant-id` / `Authorization`.
 */
export async function storekeeperJson<T>(
  path: string,
  init: StorekeeperRequestInit = {},
  forwardHeaders?: Headers,
): Promise<T> {
  const url = joinUrl(getApiBaseUrl(), path);
  const headers = mergeHeaderBases(forwardHeaders, init.headers);
  const body = init.body;
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body: body ?? undefined,
    credentials: "omit",
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError("Response was not valid JSON", res.status, "invalid_json", text);
  }

  if (!res.ok) {
    const fromDetail = formatFastApiDetail(json);
    throw new ApiError(
      fromDetail ?? `Request failed (${res.status})`,
      res.status,
      undefined,
      json,
    );
  }

  return json as T;
}

export function toSearchParams(
  record: Record<string, string | number | undefined | null>,
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(record)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}
