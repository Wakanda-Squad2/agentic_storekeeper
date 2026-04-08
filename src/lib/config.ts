/**
 * Central feature flags and env-based behavior.
 * Backend contract: keep paths aligned with FastAPI OpenAPI (see docs/openapi-codegen.md).
 */

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://agentic-storekeeper-backend.onrender.com";
}

/**
 * Use mock datasets and simulated bridge responses (no FastAPI).
 * When unset or empty, defaults to mock so local dev works without a backend.
 * Set `NEXT_PUBLIC_USE_MOCK_DATA=true` or `false` (case-insensitive). Any other value defaults to mock.
 */
export function useMockDataOnly(): boolean {
  const raw = process.env.NEXT_PUBLIC_USE_MOCK_DATA;
  if (raw === undefined || raw.trim() === "") {
    return true;
  }
  const v = raw.trim().toLowerCase();
  if (v === "false") return false;
  if (v === "true") return true;
  return true;
}

/** When true, missing/failing upstream API falls back to mock data (dev convenience). */
export function allowMockFallback(): boolean {
  return process.env.NEXT_PUBLIC_API_ALLOW_MOCK_FALLBACK === "true";
}

/**
 * Backend paths aligned with `https://agentic-storekeeper-backend.onrender.com/openapi.json`
 * (Swagger: /docs). Routes marked optional below are not in that published spec.
 */
export const API_ROUTES = {
  financialSummary: "/api/v1/financial/summary",
  documents: "/api/v1/documents",
  /**
   * Optional — not in deployed OpenAPI. Client uses `/api/bridge/.../pipeline/events`;
   * the bridge proxies this URL or synthesizes `pipeline_completed` if upstream returns 404/405.
   */
  documentPipelineEvents: (documentId: string) =>
    `/api/v1/documents/${documentId}/pipeline/events`,
  documentDetail: (documentId: string | number) => `/api/v1/documents/${documentId}`,
  /** OpenAPI: POST `/api/v1/documents/{document_id}/reprocess` */
  documentReprocess: (documentId: string | number) =>
    `/api/v1/documents/${documentId}/reprocess`,
  /** Optional — not in published OpenAPI. */
  documentParsed: (documentId: string | number) =>
    `/api/v1/documents/${documentId}/parsed`,
  /** Optional — not in published OpenAPI; use `DocumentResponse.file_path` when absent. */
  documentFile: (documentId: string | number) =>
    `/api/v1/documents/${documentId}/file`,
} as const;
