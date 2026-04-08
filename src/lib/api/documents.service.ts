import { fetchJsonValidated } from "@/lib/api/client";
import {
  documentListResponseSchema,
  documentUploadResponseSchema,
  auditTrailResponseSchema,
  recentDocumentSchema,
  type RecentDocument,
} from "@/schemas/documents";
import { allowMockFallback, useMockDataOnly } from "@/lib/config";
import { mockRecentDocuments } from "@/lib/mock-data";
import { ApiError } from "@/lib/api/errors";
import { z } from "zod";
import { storekeeperJson } from "@/lib/api/storekeeper/http";
import type { DocumentList, DocumentResponse } from "@/lib/api/storekeeper/types";
import {
  mapDocumentListToRecent,
  mapDocumentResponseToRecent,
} from "@/lib/api/storekeeper/bridge-adapters";
import { apiAbsoluteUrl, browserUpstreamHeaders } from "@/lib/api/browser-upstream";

export async function loadDocumentsList(): Promise<RecentDocument[]> {
  if (useMockDataOnly()) {
    return documentListResponseSchema.parse({ items: mockRecentDocuments }).items;
  }
  try {
    const list = await storekeeperJson<DocumentList>(
      "/api/v1/documents/",
      { method: "GET" },
      browserUpstreamHeaders(),
    );
    const items = mapDocumentListToRecent(list);
    const data = documentListResponseSchema.parse({ items });
    return data.items;
  } catch (e) {
    if (allowMockFallback() && e instanceof ApiError) {
      return documentListResponseSchema.parse({ items: mockRecentDocuments })
        .items;
    }
    throw e;
  }
}

const uploadJsonSchema = documentUploadResponseSchema;

/** One `file` field per request, matching FastAPI. Returns id from first stored document. */
export async function uploadDocumentsMetadata(
  files: File[],
): Promise<z.infer<typeof uploadJsonSchema>> {
  if (!files.length) {
    throw new ApiError("No files to upload", 400, "no_files");
  }
  let first: DocumentResponse | null = null;
  const headers = browserUpstreamHeaders();
  for (const f of files) {
    const fd = new FormData();
    fd.append("file", f, f.name);
    const doc = await storekeeperJson<DocumentResponse>(
      "/api/v1/documents/",
      { method: "POST", body: fd },
      headers,
    );
    if (!first) first = doc;
  }
  const mapped = mapDocumentResponseToRecent(first!);
  return uploadJsonSchema.parse({ id: mapped.id, job_id: undefined });
}

export async function loadDocumentById(documentId: string): Promise<RecentDocument> {
  if (useMockDataOnly()) {
    const found = mockRecentDocuments.find((d) => d.id === documentId);
    if (!found) {
      throw new ApiError("Document not found", 404, "not_found");
    }
    return recentDocumentSchema.parse(found);
  }
  const numericId = Number(documentId);
  if (!Number.isFinite(numericId)) {
    throw new ApiError("Invalid document id", 400, "invalid_id");
  }
  try {
    const doc = await storekeeperJson<DocumentResponse>(
      `/api/v1/documents/${numericId}`,
      { method: "GET" },
      browserUpstreamHeaders(),
    );
    const recent = mapDocumentResponseToRecent(doc);
    return recentDocumentSchema.parse(recent);
  } catch (e) {
    if (allowMockFallback() && e instanceof ApiError) {
      const found = mockRecentDocuments.find((d) => d.id === documentId);
      if (found) return recentDocumentSchema.parse(found);
    }
    throw e;
  }
}

export async function loadAuditTrail(documentId: string) {
  if (useMockDataOnly()) {
    return fetchJsonValidated(`/api/bridge/documents/${documentId}/audit`, {
      schema: auditTrailResponseSchema,
      credentials: "include",
    });
  }
  try {
    return await fetchJsonValidated(
      apiAbsoluteUrl(`/api/v1/documents/${documentId}/audit`),
      {
        schema: auditTrailResponseSchema,
        headers: browserUpstreamHeaders(),
        credentials: "omit",
      },
    );
  } catch (e) {
    if (allowMockFallback() && e instanceof ApiError) {
      return auditTrailResponseSchema.parse({ entries: [] });
    }
    throw e;
  }
}
