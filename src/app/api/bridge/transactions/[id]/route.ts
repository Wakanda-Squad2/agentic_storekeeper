import { NextRequest, NextResponse } from "next/server";
import { useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";
import { storekeeperJson } from "@/lib/api/storekeeper/http";
import type { TransactionResponse } from "@/lib/api/storekeeper/types";
import { ApiError } from "@/lib/api/errors";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const patchBodySchema = z
  .object({
    date: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    amount: z.union([z.number(), z.string()]).nullable().optional(),
    currency: z.string().nullable().optional(),
    type: z.enum(["income", "expense"]).nullable().optional(),
    category: z.string().nullable().optional(),
    vendor: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
    confidence: z.number().nullable().optional(),
  })
  .strict();

function mapTransaction(t: TransactionResponse) {
  const amount = Math.abs(Number(t.amount));
  const direction = t.type?.toLowerCase() === "income" ? "income" : "expense";
  return {
    id: String(t.id),
    postedAt: t.date,
    description: t.description,
    vendor: t.vendor?.trim() || "—",
    category: t.category?.trim() || "—",
    amount,
    direction,
  };
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (useMockDataOnly()) {
    return NextResponse.json(
      {
        detail:
          "Transaction updates require FastAPI. Set NEXT_PUBLIC_USE_MOCK_DATA=false.",
      },
      { status: 400 },
    );
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ detail: "Invalid transaction id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const payload = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ detail: "No fields to update" }, { status: 400 });
  }

  const headers = await bridgeUpstreamHeaders(request);

  try {
    const updated = await storekeeperJson<TransactionResponse>(
      `/api/v1/transactions/${numericId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      headers,
    );
    return NextResponse.json({ item: mapTransaction(updated) });
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

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (useMockDataOnly()) {
    return NextResponse.json(
      {
        detail:
          "Transaction delete requires FastAPI. Set NEXT_PUBLIC_USE_MOCK_DATA=false.",
      },
      { status: 400 },
    );
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ detail: "Invalid transaction id" }, { status: 400 });
  }

  const headers = await bridgeUpstreamHeaders(request);

  try {
    await storekeeperJson<unknown>(
      `/api/v1/transactions/${numericId}`,
      { method: "DELETE" },
      headers,
    );
    return new NextResponse(null, { status: 204 });
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
