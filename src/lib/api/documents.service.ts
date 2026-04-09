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

export async function loadDocumentsList(): Promise<RecentDocument[]> {
  if (useMockDataOnly()) {
    return documentListResponseSchema.parse({ items: mockRecentDocuments }).items;
  }
  try {
    const data = await fetchJsonValidated("/api/bridge/documents", {
      schema: documentListResponseSchema,
    });
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

export async function uploadDocumentsMetadata(
  files: File[],
): Promise<z.infer<typeof uploadJsonSchema>> {
  const body = new FormData();
  for (const f of files) body.append("files", f, f.name);

  return fetchJsonValidated("/api/bridge/documents", {
    schema: uploadJsonSchema,
    method: "POST",
    body,
  });
}

export async function loadDocumentById(documentId: string): Promise<RecentDocument> {
  if (useMockDataOnly()) {
    const found = mockRecentDocuments.find((d) => d.id === documentId);
    if (!found) {
      throw new ApiError("Document not found", 404, "not_found");
    }
    return recentDocumentSchema.parse(found);
  }
  try {
    return await fetchJsonValidated(`/api/bridge/documents/${documentId}`, {
      schema: recentDocumentSchema,
    });
  } catch (e) {
    if (allowMockFallback() && e instanceof ApiError) {
      const found = mockRecentDocuments.find((d) => d.id === documentId);
      if (found) return recentDocumentSchema.parse(found);
    }
    throw e;
  }
}

export async function loadAuditTrail(documentId: string) {
  try {
    return await fetchJsonValidated(
      `/api/bridge/documents/${documentId}/audit`,
      {
        schema: auditTrailResponseSchema,
      },
    );
  } catch (e) {
    if (allowMockFallback() && e instanceof ApiError) {
      return auditTrailResponseSchema.parse({ entries: [] });
    }
    throw e;
  }
}
