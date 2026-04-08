import type { TransactionResponse } from "@/lib/api/storekeeper/types";

export function mapTransactionToLedgerRow(t: TransactionResponse) {
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
