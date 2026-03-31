import { z } from "zod";
import { ApiError } from "@/lib/api/errors";

type FetchJsonOptions<T> = {
  schema: z.ZodType<T>;
  /** Default GET */
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

/**
 * Fetch JSON and validate before any UI uses the payload.
 * Always call through this (or bridge routes that do the same server-side).
 */
export async function fetchJsonValidated<T>(
  url: string,
  { schema, method = "GET", body, headers, signal }: FetchJsonOptions<T>,
): Promise<T> {
  const res = await fetch(url, {
    method,
    body,
    headers,
    signal,
    credentials: "include",
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError("Response was not valid JSON", res.status, "invalid_json", text);
  }

  if (!res.ok) {
    throw new ApiError(
      typeof (json as { detail?: string })?.detail === "string"
        ? (json as { detail: string }).detail
        : `Request failed (${res.status})`,
      res.status,
      (json as { code?: string })?.code,
      json,
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(
      `Response failed schema validation: ${parsed.error.message}`,
      res.status,
      "schema_validation",
      json,
    );
  }

  return parsed.data;
}
