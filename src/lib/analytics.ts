import { SCORE_BANDS, bandForScore, type ScoreBand } from "@/domain/constants";

/** Pure aggregation helpers used by the dashboard and programme views. */

export function sum(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0);
}

export function avg(ns: number[]): number {
  return ns.length ? sum(ns) / ns.length : 0;
}

export function median(ns: number[]): number {
  if (!ns.length) return 0;
  const s = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function countBy<T>(items: T[], key: (t: T) => string): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([name, value]) => ({ name, value }));
}

/** Distribution of scores across the five bands (ordered). */
export function bandDistribution(values: number[]): { name: ScoreBand; value: number }[] {
  const counts = new Map<ScoreBand, number>(SCORE_BANDS.map((b) => [b, 0]));
  for (const v of values) {
    const b = bandForScore(v);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return SCORE_BANDS.map((b) => ({ name: b, value: counts.get(b) ?? 0 }));
}

/** Average of a numeric field grouped by a category, returned sorted desc. */
export function avgByCategory<T>(
  items: T[],
  category: (t: T) => string,
  value: (t: T) => number,
): { name: string; value: number }[] {
  const groups = new Map<string, number[]>();
  for (const it of items) {
    const c = category(it);
    const arr = groups.get(c) ?? [];
    arr.push(value(it));
    groups.set(c, arr);
  }
  return [...groups.entries()]
    .map(([name, vals]) => ({ name, value: Math.round(avg(vals) * 10) / 10 }))
    .sort((a, b) => b.value - a.value);
}
