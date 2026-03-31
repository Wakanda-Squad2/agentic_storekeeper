import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES, getApiBaseUrl, useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import {
  documentListResponseSchema,
  documentUploadResponseSchema,
} from "@/schemas/documents";
import { mockRecentDocuments } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  if (useMockDataOnly()) {
    const data = documentListResponseSchema.parse({ items: mockRecentDocuments });
    return NextResponse.json(data);
  }

  const url = new URL(API_ROUTES.documents, getApiBaseUrl());
  const headers = await bridgeUpstreamHeaders(request);

  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store" });
  } catch {
    return NextResponse.json(
      { detail: "Upstream API unreachable", code: "upstream_down" },
      { status: 503 },
    );
  }

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON from upstream" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(body, { status: res.status });
  }

  const parsed = documentListResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        detail: "Document list failed schema validation",
        issues: parsed.error.flatten(),
      },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed.data);
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
  const url = new URL(API_ROUTES.documents, getApiBaseUrl());
  const headers = await bridgeUpstreamHeaders(request);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Upstream API unreachable" },
      { status: 503 },
    );
  }

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON from upstream" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(body, { status: res.status });
  }

  const parsed = documentUploadResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        detail: "Upload response failed schema validation; adjust Zod to match FastAPI",
        issues: parsed.error.flatten(),
        raw: body,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed.data, { status: res.status });
}
