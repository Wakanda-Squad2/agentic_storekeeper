import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { auditTrailResponseSchema } from "@/schemas/documents";

/** Align path with FastAPI when audit API exists. */
const auditPath = (id: string) => `/api/v1/documents/${id}/audit`;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  if (useMockDataOnly()) {
    return NextResponse.json(
      auditTrailResponseSchema.parse({
        entries: [
          {
            id: "a1",
            ts: "2026-03-28T10:00:00Z",
            actor_id: "user_1",
            actor_label: "Jane Doe",
            action: "upload",
            detail: "Uploaded original PDF",
          },
          {
            id: "a2",
            ts: "2026-03-28T10:02:00Z",
            actor_id: "agent:parser",
            actor_label: "Parsing agent",
            action: "agent_reparse",
            detail: "Structured JSON v1 generated",
          },
        ],
      }),
    );
  }

  const url = new URL(auditPath(id), getApiBaseUrl());
  const headers = await bridgeUpstreamHeaders(request);
  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store" });
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
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json(body, { status: res.status });
  }

  const parsed = auditTrailResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "Audit response validation failed", raw: body },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed.data);
}
