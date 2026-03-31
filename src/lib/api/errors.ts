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
