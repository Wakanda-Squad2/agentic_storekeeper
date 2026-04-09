import { NextRequest, NextResponse } from "next/server";
import { useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { mockFinancialSummary } from "@/lib/mock-data";
import { buildFinancialSummaryFromStorekeeper } from "@/lib/api/storekeeper/bridge-adapters";
import { ApiError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  if (useMockDataOnly()) {
    return NextResponse.json(mockFinancialSummary);
  }

  const headers = await bridgeUpstreamHeaders(request);
  const sp = request.nextUrl.searchParams;
  const query = {
    from: sp.get("from"),
    to: sp.get("to"),
    category: sp.get("category"),
    vendor: sp.get("vendor"),
  };

  try {
    const data = await buildFinancialSummaryFromStorekeeper(headers, query);
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
