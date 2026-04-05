/**
 * Central feature flags and env-based behavior.
 * Backend contract: keep paths aligned with FastAPI OpenAPI (see docs/openapi-codegen.md).
 */

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

/**
 * Use mock datasets and simulated bridge responses (no FastAPI).
 * Defaults to true when unset so local dev works without a backend.
 * Set `NEXT_PUBLIC_USE_MOCK_DATA=false` when FastAPI is ready.
 */
export function useMockDataOnly(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
}

/**
 * Whether `/api/auth/login` and mock registration use built-in demo users (no FastAPI).
 * Uses a server-only env first so `next start` / Docker can turn demo auth on without
 * rebuilding (NEXT_PUBLIC_* is often fixed at build time).
 *
 * - `STOREKEEPER_AUTH_MOCK=true` — force demo credentials on
 * - `STOREKEEPER_AUTH_MOCK=false` — force FastAPI login/register
 * - unset — follow `NEXT_PUBLIC_USE_MOCK_DATA` (not `false` ⇒ mock on)
 */
export function authUsesMockCredentials(): boolean {
  const override = process.env.STOREKEEPER_AUTH_MOCK;
  if (override === "true") return true;
  if (override === "false") return false;
  return useMockDataOnly();
}

/** When true, missing/failing upstream API falls back to mock data (dev convenience). */
export function allowMockFallback(): boolean {
  return process.env.NEXT_PUBLIC_API_ALLOW_MOCK_FALLBACK === "true";
}

/** Backend paths — change once to match your FastAPI routes. */
export const API_ROUTES = {
  authLogin: "/api/v1/auth/login",
  authRegister: "/api/v1/auth/register",
  financialSummary: "/api/v1/financial/summary",
  documents: "/api/v1/documents",
  documentPipelineEvents: (documentId: string) =>
    `/api/v1/documents/${documentId}/pipeline/events`,
  documentDetail: (documentId: string) => `/api/v1/documents/${documentId}`,
  documentReparse: (documentId: string) =>
    `/api/v1/documents/${documentId}/agents/reparse`,
  documentParsed: (documentId: string) =>
    `/api/v1/documents/${documentId}/parsed`,
  /** Binary file for preview/download — adjust if your FastAPI route differs (e.g. `/download`). */
  documentFile: (documentId: string | number) =>
    `/api/v1/documents/${documentId}/file`,
} as const;
