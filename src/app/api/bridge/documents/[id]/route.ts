import { NextRequest, NextResponse } from "next/server";
import { useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { mockRecentDocuments } from "@/lib/mock-data";
import { recentDocumentSchema } from "@/schemas/documents";
import { storekeeperJson } from "@/lib/api/storekeeper/http";
import type { DocumentResponse } from "@/lib/api/storekeeper/types";
import { mapDocumentResponseToRecent } from "@/lib/api/storekeeper/bridge-adapters";
import { ApiError } from "@/lib/api/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ detail: "Invalid document id" }, { status: 400 });
  }

  if (useMockDataOnly()) {
    const found = mockRecentDocuments.find((d) => d.id === id);
    if (!found) {
      return NextResponse.json({ detail: "Not found" }, { status: 404 });
    }
    return NextResponse.json(recentDocumentSchema.parse(found));
  }

  const headers = await bridgeUpstreamHeaders(request);

  try {
    const doc = await storekeeperJson<DocumentResponse>(
      `/api/v1/documents/${numericId}`,
      { method: "GET" },
      headers,
    );
    const recent = mapDocumentResponseToRecent(doc);
    return NextResponse.json(recentDocumentSchema.parse(recent));
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 404) {
        return NextResponse.json({ detail: e.message }, { status: 404 });
      }
      return NextResponse.json(
        { detail: e.message, body: e.body },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 },
      );
    }
    return NextResponse.json({ detail: "Upstream API unreachable" }, { status: 503 });
  }
}
