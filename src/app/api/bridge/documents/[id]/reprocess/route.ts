import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES, getApiBaseUrl, useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";

type Ctx = { params: Promise<{ id: string }> };

/** Proxies FastAPI `POST /api/v1/documents/{document_id}/reprocess` (see deployed OpenAPI). */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  if (useMockDataOnly()) {
    return NextResponse.json({ ok: true, document_id: id, job_id: `job_${Date.now()}` });
  }

  const url = new URL(API_ROUTES.documentReprocess(id), getApiBaseUrl());
  const headers = await bridgeUpstreamHeaders(request);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "Upstream unreachable" }, { status: 503 });
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
