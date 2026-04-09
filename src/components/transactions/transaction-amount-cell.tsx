"use client";

import { useLedgerDisplayFormat } from "@/hooks/use-ledger-display-format";
import type { LedgerTransactionRow } from "@/lib/api/transactions.service";

type Props = { row: LedgerTransactionRow };

/**
 * Formats amount using the row’s ledger `currency` from the API (not a global mock/live guess),
 * then converts to the user’s display currency when they differ.
 */
export function TransactionAmountCell({ row }: Props) {
  const { format } = useLedgerDisplayFormat(row.currency);
  return (
    <>
      {row.direction === "income" ? "+" : "−"}
      {format(row.amount, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
    </>
  );
}
