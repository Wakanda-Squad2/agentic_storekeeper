export type PipelineErrorCode =
  | "ocr_failed"
  | "parse_failed"
  | "validation_mismatch"
  | "classification_failed"
  | "reconciliation_failed"
  | "unknown";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/**
 * Turn JSON error bodies from FastAPI or the Next bridge into a single line for alerts.
 * FastAPI validation errors use `detail` as an array of `{ loc, msg, type }`.
 */
export function formatApiErrorJson(json: unknown, httpStatus: number): string {
  if (json === null || json === undefined) {
    return `Request failed (${httpStatus})`;
  }
  if (typeof json === "string") return json;

  if (typeof json === "object") {
    const o = json as Record<string, unknown>;

    if (typeof o.detail === "string") return o.detail;

    if (Array.isArray(o.detail)) {
      const parts = o.detail.map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          const loc = (item as { loc?: unknown }).loc;
          const where =
            Array.isArray(loc) && loc.length
              ? `${loc.filter((x) => typeof x === "string").join(".")}: `
              : "";
          return `${where}${String(msg ?? item)}`;
        }
        return typeof item === "string" ? item : JSON.stringify(item);
      });
      if (parts.length) return parts.join(" · ");
    }

    if (typeof o.message === "string") return o.message;

    if (typeof o.detail === "object" && o.detail !== null) {
      return JSON.stringify(o.detail);
    }

    if (o.code != null && o.body !== undefined) {
      return `${String(o.code)}: ${typeof o.body === "string" ? o.body : JSON.stringify(o.body)}`;
    }
  }

  try {
    return JSON.stringify(json);
  } catch {
    return `Request failed (${httpStatus})`;
  }
}

export function userFacingPipelineMessage(code: PipelineErrorCode): string {
  const map: Record<PipelineErrorCode, string> = {
    ocr_failed:
      "OCR could not read this document. Try a higher-resolution scan or a different file.",
    parse_failed:
      "The parser could not build structured data. You can edit fields manually or re-run agents.",
    validation_mismatch:
      "Totals or line items failed validation against extracted figures. Review amounts or correct manually.",
    classification_failed:
      "Document type or category could not be assigned confidently. Pick a type or override classification.",
    reconciliation_failed:
      "This document could not be matched to ledger transactions. Retry or reconcile manually.",
    unknown: "Processing failed. Retry upload or contact support.",
  };
  return map[code];
}
