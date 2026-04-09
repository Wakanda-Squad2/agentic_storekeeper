"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFxRate } from "@/lib/currency/frankfurter";
import { formatMoney } from "@/lib/format-money";
import { queryKeys } from "@/lib/queries/query-keys";
import { useDisplayCurrency } from "@/components/providers/display-currency-provider";

type FormatOpts = Pick<
  Intl.NumberFormatOptions,
  "maximumFractionDigits" | "minimumFractionDigits"
>;

/**
 * Formats ledger amounts in the user’s display currency using Frankfurter spot rates,
 * refreshed on an interval while the dashboard is open.
 */
export function useLedgerDisplayFormat(ledgerCurrencyCode: string) {
  const { displayCurrency } = useDisplayCurrency();
  const from = ledgerCurrencyCode.trim().toUpperCase();
  const to = displayCurrency.trim().toUpperCase();
  const same = from.length === 3 && to.length === 3 && from === to;

  const rateQuery = useQuery({
    queryKey: queryKeys.fx.rate(from, to),
    queryFn: () => fetchFxRate(from, to),
    enabled: !same && from.length === 3 && to.length === 3,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  const factor: number | null = useMemo(() => {
    if (same) return 1;
    if (!rateQuery.isSuccess) return null;
    return rateQuery.data;
  }, [same, rateQuery.isSuccess, rateQuery.data]);

  const convert = useCallback(
    (amount: number) => {
      if (same) return amount;
      if (factor == null) return amount;
      return amount * factor;
    },
    [same, factor],
  );

  const format = useCallback(
    (amount: number, options?: FormatOpts) => {
      if (same) return formatMoney(amount, to, options);
      if (factor == null) return formatMoney(amount, from, options);
      return formatMoney(amount * factor, to, options);
    },
    [same, from, to, factor],
  );

  return {
    displayCurrency: to,
    ledgerCurrency: from,
    convert,
    format,
    rateLoading: !same && rateQuery.isPending,
    rateError: !same && rateQuery.isError,
  };
}
