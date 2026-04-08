"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMockDataOnly } from "@/lib/config";
import { ledgerCurrencyFromMockMode } from "@/lib/currency/ledger-currency";

const STORAGE_KEY = "storekeeper-display-currency";

type DisplayCurrencyContextValue = {
  /** User-selected ISO code for dashboards (persisted). */
  displayCurrency: string;
  setDisplayCurrency: (code: string) => void;
  /** Default ledger currency for this environment (mock → USD, live → NGN). */
  environmentLedgerCurrency: string;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(
  null,
);

export function DisplayCurrencyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mockOnly = useMockDataOnly();
  const environmentLedgerCurrency = ledgerCurrencyFromMockMode(mockOnly);
  const [displayCurrency, setDisplayCurrencyState] = useState(
    environmentLedgerCurrency,
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)?.trim();
      if (raw && /^[A-Za-z]{3}$/.test(raw)) {
        setDisplayCurrencyState(raw.toUpperCase());
      } else {
        setDisplayCurrencyState(environmentLedgerCurrency);
      }
    } catch {
      setDisplayCurrencyState(environmentLedgerCurrency);
    }
  }, [environmentLedgerCurrency]);

  const setDisplayCurrency = useCallback((code: string) => {
    const c = code.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(c)) return;
    setDisplayCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      environmentLedgerCurrency,
    }),
    [displayCurrency, setDisplayCurrency, environmentLedgerCurrency],
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    throw new Error(
      "useDisplayCurrency must be used within DisplayCurrencyProvider",
    );
  }
  return ctx;
}
