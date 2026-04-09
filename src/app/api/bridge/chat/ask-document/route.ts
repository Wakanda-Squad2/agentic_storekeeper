import { NextRequest, NextResponse } from "next/server";
import { useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { storekeeperJson } from "@/lib/api/storekeeper/http";
import { ApiError } from "@/lib/api/errors";
import { z } from "zod";

const bodySchema = z.object({
  document_id: z.number().int().positive(),
  question: z.string().min(1),
  tenant_id: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  if (useMockDataOnly()) {
    return NextResponse.json({
      answer: `Mock mode: would ask FastAPI about document #${parsed.data.document_id}: "${parsed.data.question.slice(0, 120)}${parsed.data.question.length > 120 ? "…" : ""}"`,
      data: { mode: "mock", document_id: parsed.data.document_id },
    });
  }

  const headers = await bridgeUpstreamHeaders(request);

  try {
    const res = await storekeeperJson<Record<string, unknown>>(
      "/api/v1/chat/ask-about-document",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: parsed.data.document_id,
          question: parsed.data.question,
          ...(parsed.data.tenant_id != null && parsed.data.tenant_id !== ""
            ? { tenant_id: parsed.data.tenant_id }
            : {}),
        }),
      },
      headers,
    );
    return NextResponse.json(res);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json(
        { detail: e.message, body: e.body },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 },
      );
    }
    return NextResponse.json({ detail: "Upstream API unreachable" }, { status: 503 });
  }
}
