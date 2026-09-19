/** Formatting helpers used across the UI. Deterministic, locale-fixed (en-GB). */

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const GBP_PRECISE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

/** Format a whole-pound currency value, e.g. £340,000. */
export function formatGBP(value: number): string {
  return GBP.format(Math.round(value));
}

/** Compact currency for large figures, e.g. £1.8m, £340k. */
export function formatGBPCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `£${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
  if (abs >= 1_000) return `£${Math.round(value / 1_000)}k`;
  return GBP_PRECISE.format(Math.round(value));
}

export function formatPct(value: number, dp = 1): string {
  return `${value.toFixed(dp)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatPayback(years: number | null): string {
  if (years === null) return "—";
  return `${years.toFixed(1)} yr`;
}
