import type { TransactionResponse } from "@/lib/api/storekeeper/types";
import { parseApiAmount } from "@/lib/money/parse-api-amount";

export function mapTransactionToLedgerRow(t: TransactionResponse) {
  const amount = Math.abs(parseApiAmount(t.amount));
  const direction = t.type?.toLowerCase() === "income" ? "income" : "expense";
  const cur = t.currency?.trim().toUpperCase();
  const currency = cur && /^[A-Z]{3}$/.test(cur) ? cur : "NGN";
  return {
    id: String(t.id),
    postedAt: t.date,
    description: t.description,
    vendor: t.vendor?.trim() || "—",
    category: t.category?.trim() || "—",
    amount,
    direction,
    currency,
  };
}
