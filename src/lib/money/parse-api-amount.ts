/**
 * Parse FastAPI-style decimal strings (and numeric JSON) without IEEE drift from `Number(bigString)`.
 */
export function parseApiAmount(input: string | number): number {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : 0;
  }

  const s = String(input).trim().replace(/,/g, "");
  if (!s || s === "." || s === "+" || s === "-") return 0;

  const negative = s.startsWith("-");
  const unsigned = (negative || s.startsWith("+") ? s.slice(1) : s).trim();
  const [wholeRaw, fracRaw = ""] = unsigned.split(".");
  if (fracRaw.includes(".") || !/^\d*$/.test(wholeRaw) || !/^\d*$/.test(fracRaw)) {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const whole = wholeRaw === "" ? BigInt(0) : BigInt(wholeRaw);
  if (fracRaw.length === 0) {
    const n = Number(whole);
    return negative ? -n : n;
  }

  const scale = BigInt(10) ** BigInt(fracRaw.length);
  const frac = BigInt(fracRaw);
  const raw = whole * scale + frac;
  const q = Number(raw) / Number(scale);
  if (!Number.isFinite(q)) {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  return negative ? -q : q;
}
