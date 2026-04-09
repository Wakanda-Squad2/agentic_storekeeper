import { NextRequest, NextResponse } from "next/server";
import { useMockDataOnly } from "@/lib/config";
import { useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { storekeeperJson } from "@/lib/api/storekeeper/http";
import type { ChatRequest, ChatResponse } from "@/lib/api/storekeeper/types";
import { ApiError } from "@/lib/api/errors";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().min(1),
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
    return NextResponse.json({ detail: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  if (useMockDataOnly()) {
    const res: ChatResponse = {
      answer:
        "Mock mode: set NEXT_PUBLIC_USE_MOCK_DATA=false and run FastAPI to get live answers.",
      data: { mode: "mock" },
    };
    return NextResponse.json(res);
  }

  if (useMockDataOnly()) {
    const res: ChatResponse = {
      answer:
        "Mock mode: set NEXT_PUBLIC_USE_MOCK_DATA=false and run FastAPI to get live answers.",
      data: { mode: "mock" },
    };
    return NextResponse.json(res);
  }

  const headers = await bridgeUpstreamHeaders(request);
  const body: ChatRequest = {
    message: parsed.data.message,
    tenant_id: parsed.data.tenant_id,
  };

  try {
    const res = await storekeeperJson<ChatResponse>(
      "/api/v1/chat/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
