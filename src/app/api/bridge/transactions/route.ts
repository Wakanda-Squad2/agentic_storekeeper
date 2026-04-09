import { NextRequest, NextResponse } from "next/server";
import { useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { storekeeperJson, toSearchParams } from "@/lib/api/storekeeper/http";
import type { TransactionResponse } from "@/lib/api/storekeeper/types";
import { ApiError } from "@/lib/api/errors";
import { mockLedgerTransactions } from "@/lib/mock-data";
import { mapTransactionToLedgerRow } from "@/lib/api/map-transaction";

export async function GET(request: NextRequest) {
  if (useMockDataOnly()) {
    return NextResponse.json({ items: mockLedgerTransactions });
  }

  const sp = request.nextUrl.searchParams;
  const pageNum = Number(sp.get("page") ?? "1");
  const sizeNum = Number(sp.get("size") ?? "100");
  const q = toSearchParams({
    page: Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1,
    size:
      Number.isFinite(sizeNum) && sizeNum >= 1 ? Math.min(100, Math.floor(sizeNum)) : 100,
    transaction_type: sp.get("transaction_type") ?? undefined,
    start_date: sp.get("start_date") ?? undefined,
    end_date: sp.get("end_date") ?? undefined,
    category: sp.get("category") ?? undefined,
    vendor: sp.get("vendor") ?? undefined,
  });

  const headers = await bridgeUpstreamHeaders(request);

  try {
    const raw = await storekeeperJson<TransactionResponse[]>(
      `/api/v1/transactions/${q}`,
      { method: "GET" },
      headers,
    );
    const items = raw.map(mapTransactionToLedgerRow);
    return NextResponse.json({ items });
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
