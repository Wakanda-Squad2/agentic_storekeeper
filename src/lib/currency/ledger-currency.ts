/** Canonical currency for ledger rows when the API does not attach per-row ISO codes. */
export function ledgerCurrencyFromMockMode(mockOnly: boolean): string {
  return mockOnly ? "USD" : "NGN";
}
