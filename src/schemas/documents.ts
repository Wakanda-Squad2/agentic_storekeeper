import { z } from "zod";

export const documentStatusSchema = z.enum([
  "uploaded",
  "ocr",
  "classified",
  "parsed",
  "validated",
  "categorized",
  "reconciled",
  "failed",
]);

export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const recentDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: documentStatusSchema,
  updatedAt: z.string(),
  /** MIME type from upstream (e.g. `application/pdf`, `image/jpeg`) for preview routing. */
  mimeType: z.string().optional(),
});

export type RecentDocument = z.infer<typeof recentDocumentSchema>;

export const documentListResponseSchema = z.object({
  items: z.array(recentDocumentSchema),
});

export const documentUploadResponseSchema = z.object({
  id: z.string(),
  /** Subscribe to SSE at pipeline events URL using this id when provided. */
  job_id: z.string().optional(),
});

export const documentParsePatchSchema = z.record(z.string(), z.unknown());

export const auditEntrySchema = z.object({
  id: z.string(),
  ts: z.string(),
  actor_id: z.string(),
  actor_label: z.string(),
  action: z.enum([
    "upload",
    "edit_parsed",
    "agent_reparse",
    "override_category",
    "manual_validate",
  ]),
  detail: z.string().optional(),
  payload_diff: z.record(z.string(), z.unknown()).optional(),
});

export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const auditTrailResponseSchema = z.object({
  entries: z.array(auditEntrySchema),
});
