/**
 * Central feature flags and env-based behavior.
 * Backend contract: keep paths aligned with FastAPI OpenAPI (see docs/openapi-codegen.md).
 */

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://agentic-storekeeper-backend.onrender.com";
}

/**
 * Use mock datasets and simulated bridge responses (no FastAPI).
 * Defaults to true when unset so local dev works without a backend.
 * Set `NEXT_PUBLIC_USE_MOCK_DATA=false` when FastAPI is ready.
 */
export function useMockDataOnly(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";
}

/** When true, missing/failing upstream API falls back to mock data (dev convenience). */
export function allowMockFallback(): boolean {
  return process.env.NEXT_PUBLIC_API_ALLOW_MOCK_FALLBACK === "true";
}

/** Backend paths — change once to match your FastAPI routes. Auth is app-side only (JWT cookie). */
export const API_ROUTES = {
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
