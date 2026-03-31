import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES, getApiBaseUrl, useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.text();

  if (useMockDataOnly()) {
    return NextResponse.json({ ok: true, document_id: id, mock: true });
  }

  const url = new URL(API_ROUTES.documentParsed(id), getApiBaseUrl());
  const headers = await bridgeUpstreamHeaders(request);
  headers.set("Content-Type", "application/json");
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers,
      body,
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
