const FRANKFURTER_V2 = "https://api.frankfurter.dev/v2";

export type FrankfurterCurrencyRow = {
  iso_code: string;
  name: string;
};

/** Units of `quote` per one unit of `base` (multiply amount in base by this to get quote). */
export async function fetchFxRate(base: string, quote: string): Promise<number> {
  const from = base.trim().toUpperCase();
  const to = quote.trim().toUpperCase();
  if (from.length !== 3 || to.length !== 3) {
    throw new Error("Currency codes must be ISO 4217 (3 letters).");
  }
  if (from === to) return 1;

  const url = `${FRANKFURTER_V2}/rates?base=${encodeURIComponent(from)}&quotes=${encodeURIComponent(to)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`FX ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Unexpected FX response shape");
  }
  const rate = (rows[0] as { rate?: unknown }).rate;
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error("Missing FX rate");
  }
  return rate;
}

export async function fetchFrankfurterCurrencies(): Promise<FrankfurterCurrencyRow[]> {
  const res = await fetch(`${FRANKFURTER_V2}/currencies`);
  if (!res.ok) {
    throw new Error("Could not load currency list");
  }
  const rows = (await res.json()) as FrankfurterCurrencyRow[];
  return Array.isArray(rows) ? rows : [];
}
