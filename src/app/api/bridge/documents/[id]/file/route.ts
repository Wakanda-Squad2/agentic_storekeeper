import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES, getApiBaseUrl, useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { mockRecentDocuments } from "@/lib/mock-data";
import {
  isImageFile,
  isPdfFile,
  MOCK_SAMPLE_IMAGE_URL,
  MOCK_SAMPLE_PDF_URL,
} from "@/lib/document-preview";

type Ctx = { params: Promise<{ id: string }> };

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  if (useMockDataOnly()) {
    const doc = mockRecentDocuments.find((d) => d.id === id);
    if (!doc) {
      return NextResponse.json({ detail: "Document not found" }, { status: 404 });
    }
    if (isPdfFile(doc.name, doc.mimeType)) {
      return NextResponse.redirect(MOCK_SAMPLE_PDF_URL, 307);
    }
    if (isImageFile(doc.name, doc.mimeType)) {
      return NextResponse.redirect(MOCK_SAMPLE_IMAGE_URL, 307);
    }
    return NextResponse.redirect(MOCK_SAMPLE_PDF_URL, 307);
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ detail: "Invalid document id" }, { status: 400 });
  }

  const headers = await bridgeUpstreamHeaders(request);
  const url = joinUrl(getApiBaseUrl(), API_ROUTES.documentFile(numericId));

  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store" });
  } catch {
    return NextResponse.json({ detail: "Upstream API unreachable" }, { status: 503 });
  }

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "text/plain" },
    });
  }

  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const buf = await res.arrayBuffer();
  const disposition = res.headers.get("content-disposition");

  const outHeaders = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=120",
  });
  if (disposition) outHeaders.set("Content-Disposition", disposition);

  return new NextResponse(buf, { status: 200, headers: outHeaders });
}
