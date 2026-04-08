"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { useDisplayCurrency } from "@/components/providers/display-currency-provider";
import { fetchFrankfurterCurrencies } from "@/lib/currency/frankfurter";
import { queryKeys } from "@/lib/queries/query-keys";
import { cn } from "@/lib/utils";

/** If the public currency list fails, still allow switching among common ISO codes. */
const FALLBACK_ISO = [
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "ZAR",
  "KES",
  "INR",
  "GHS",
  "XOF",
] as const;

export function CurrencySwitcher({
  className,
}: {
  className?: string;
}) {
  const { displayCurrency, setDisplayCurrency, environmentLedgerCurrency } =
    useDisplayCurrency();

  const q = useQuery({
    queryKey: queryKeys.fx.currencies,
    queryFn: fetchFrankfurterCurrencies,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60_000,
  });

  const options = useMemo(() => {
    if (q.isError) {
      return FALLBACK_ISO.map((iso_code) => ({
        iso_code,
        name: iso_code,
      }));
    }
    const rows = q.data ?? [];
    return [...rows].sort((a, b) =>
      a.iso_code.localeCompare(b.iso_code, "en"),
    );
  }, [q.data, q.isError]);

  const quoteHint =
    displayCurrency === environmentLedgerCurrency
      ? "Ledger amounts"
      : `Converted from ${environmentLedgerCurrency}`;

  return (
    <label
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Coins className="size-4 shrink-0 text-foreground/70" aria-hidden />
      <span className="sr-only">Display currency</span>
      <select
        className={cn(
          "border-input bg-background text-foreground hover:bg-muted/60 focus-visible:ring-ring max-w-[220px] rounded-md border py-1.5 ps-2 pe-8 text-xs font-medium shadow-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
          q.isError ? "border-amber-500/50" : "",
        )}
        value={displayCurrency}
        disabled={q.isLoading && !q.isError}
        onChange={(e) => setDisplayCurrency(e.target.value)}
        title={`${quoteHint}. Rates refresh about every five minutes (Frankfurter).${
          q.isError ? " Using a short currency list because the full catalog could not be loaded." : ""
        }`}
      >
        {options.length === 0 && !q.isError ? (
          <option value={displayCurrency}>{displayCurrency}</option>
        ) : null}
        {options.map((row) => (
          <option key={row.iso_code} value={row.iso_code}>
            {row.iso_code} — {row.name}
          </option>
        ))}
      </select>
    </label>
  );
}
