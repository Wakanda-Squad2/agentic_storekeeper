import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES, getApiBaseUrl, useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { financialSummarySchema } from "@/schemas/financial";
import { mockFinancialSummary } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  if (useMockDataOnly()) {
    return NextResponse.json(mockFinancialSummary);
  }

  const url = new URL(API_ROUTES.financialSummary, getApiBaseUrl());
  request.nextUrl.searchParams.forEach((v, k) => {
    url.searchParams.set(k, v);
  });

  const headers = await bridgeUpstreamHeaders(request);

  let res: Response;
  try {
    res = await fetch(url, {
      headers,
      next: { revalidate: 0 },
    });
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
      { detail: "Invalid JSON from upstream", code: "bad_upstream" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(body, { status: res.status });
  }

  const parsed = financialSummarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        detail: "Upstream response failed schema validation",
        code: "schema_mismatch",
        issues: parsed.error.flatten(),
      },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed.data);
}
