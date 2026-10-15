// Money is stored as integer minor units (bigint in DB). Never use floats.
export const CURRENCY_DECIMALS: Record<string, number> = { IDR: 0, USD: 2, EUR: 2, SGD: 2, AUD: 2 };

const decimals = (c: string): number => {
  const d = CURRENCY_DECIMALS[c.toUpperCase()];
  if (d === undefined) throw new Error(`Unsupported currency: ${c}`);
  return d;
};

/** Parse a decimal string like "1250.50" into minor units without floating-point math. */
export function toMinor(amount: string, currency: string): bigint {
  const d = decimals(currency);
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (!m) throw new Error(`Invalid amount: ${amount}`);
  const frac = m[3] ?? "";
  if (frac.length > d) throw new Error(`Too many decimal places for ${currency}`);
  const minor = BigInt(m[2] + frac.padEnd(d, "0"));
  return m[1] ? -minor : minor;
}

export function formatMinor(minor: bigint, currency: string, locale = "en"): string {
  const d = decimals(currency);
  const value = Number(minor) / 10 ** d; // display only, never for arithmetic
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: d }).format(value);
}

/** Convert using an explicit recorded rate (decimal string), rounding half-up (non-negative amounts). */
export function convertMinor(minor: bigint, rate: string, fromCur: string, toCur: string): bigint {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(rate);
  if (!m) throw new Error("Invalid rate");
  const rf = m[2] ?? "";
  const num = BigInt(m[1] + rf) * 10n ** BigInt(decimals(toCur));
  const den = 10n ** BigInt(rf.length) * 10n ** BigInt(decimals(fromCur));
  return (minor * num * 2n + den) / (den * 2n);
}
