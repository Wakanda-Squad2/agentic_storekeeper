/** Format amounts with ISO 4217 codes (e.g. NGN, USD). Falls back if code is invalid. */
export function formatMoney(
  amount: number,
  currencyCode: string,
  options?: Pick<Intl.NumberFormatOptions, "maximumFractionDigits" | "minimumFractionDigits">,
): string {
  const code =
    currencyCode?.length === 3 ? currencyCode.toUpperCase() : "USD";
  const base: Intl.NumberFormatOptions = {
    style: "currency",
    currency: code,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits,
  };
  try {
    return new Intl.NumberFormat(undefined, base).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
