import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import {
  documentListResponseSchema,
  documentUploadResponseSchema,
} from "@/schemas/documents";
import { mockRecentDocuments } from "@/lib/mock-data";
import { storekeeperJson } from "@/lib/api/storekeeper/http";
import type { DocumentList, DocumentResponse } from "@/lib/api/storekeeper/types";
import {
  mapDocumentListToRecent,
  mapDocumentResponseToRecent,
} from "@/lib/api/storekeeper/bridge-adapters";
import { ApiError } from "@/lib/api/errors";

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function GET(request: NextRequest) {
  if (useMockDataOnly()) {
    const data = documentListResponseSchema.parse({ items: mockRecentDocuments });
    return NextResponse.json(data);
  }

  const headers = await bridgeUpstreamHeaders(request);

  try {
    const list = await storekeeperJson<DocumentList>(
      "/api/v1/documents/",
      { method: "GET" },
      headers,
    );
    const items = mapDocumentListToRecent(list);
    const data = documentListResponseSchema.parse({ items });
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json(
        { detail: e.message, code: "upstream_error", body: e.body },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 },
      );
    }
    return NextResponse.json(
      { detail: "Upstream API unreachable", code: "upstream_down" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (useMockDataOnly()) {
    return NextResponse.json(
      documentUploadResponseSchema.parse({
        id: `mock_${Date.now()}`,
        job_id: `job_mock_${Date.now()}`,
      }),
      { status: 201 },
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ detail: "No files in multipart field `files`" }, { status: 400 });
  }

  const headers = await bridgeUpstreamHeaders(request);
  const base = getApiBaseUrl();

  /** FastAPI accepts one `file` per request; track the first doc for pipeline UI. */
  let first: DocumentResponse | null = null;

  try {
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const url = joinUrl(base, "/api/v1/documents/");
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: fd,
        cache: "no-store",
      });
      const text = await res.text();
      let body: unknown;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        return NextResponse.json({ detail: "Invalid JSON from upstream" }, { status: 502 });
      }
      if (!res.ok) {
        return NextResponse.json(body, { status: res.status });
      }
      const doc = body as DocumentResponse;
      if (!first) first = doc;
    }
  } catch {
    return NextResponse.json({ detail: "Upstream API unreachable" }, { status: 503 });
  }

  if (!first) {
    return NextResponse.json({ detail: "Upload produced no document" }, { status: 502 });
  }

  const mapped = mapDocumentResponseToRecent(first);
  const payload = documentUploadResponseSchema.parse({
    id: mapped.id,
    job_id: undefined,
  });

  return NextResponse.json(payload, { status: 201 });
}
