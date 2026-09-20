import { bandForScore, confidenceForScore } from "../constants";
import type { ConfidenceLevel } from "../constants";
import type { ScoreComponent } from "./types";

export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

/** Round to a whole number for display; keep engine internally continuous. */
export function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Invert a "higher is worse" rating into a "higher is better" contribution. */
export function invert(n: number): number {
  return clamp(100 - n);
}

/** Weighted average of components, where weights need not sum to exactly 1. */
export function weightedScore(components: ScoreComponent[]): number {
  const totalWeight = components.reduce((acc, c) => acc + c.weight, 0);
  if (totalWeight === 0) return 0;
  const sum = components.reduce((acc, c) => acc + c.value * c.weight, 0);
  return round(clamp(sum / totalWeight));
}

/** Convert a payback in years into a 0-100 desirability contribution. */
export function paybackContribution(paybackYears: number): number {
  if (paybackYears <= 0) return 50; // undefined / not yet estimated
  if (paybackYears <= 1) return 100;
  if (paybackYears >= 8) return 5;
  // Linear-ish decay between 1 and 8 years.
  return clamp(100 - (paybackYears - 1) * 13.5);
}

/**
 * Convert capital intensity (capex relative to annual commercial benefit) into
 * a 0-100 contribution. Lower intensity = higher score.
 */
export function capitalIntensityContribution(
  capex: number,
  annualBenefit: number,
): number {
  if (annualBenefit <= 0) return 20;
  const ratio = capex / annualBenefit; // years of benefit to repay capex
  if (ratio <= 1) return 95;
  if (ratio >= 10) return 10;
  return clamp(100 - (ratio - 1) * 9.5);
}

export interface DriverExtraction {
  positiveDrivers: string[];
  negativeDrivers: string[];
}

/**
 * Produce human-readable positive/negative drivers from components using
 * transparent thresholds. Components above `strong` are strengths; below
 * `weak` are weaknesses.
 */
export function extractDrivers(
  components: ScoreComponent[],
  strong = 70,
  weak = 45,
): DriverExtraction {
  const positiveDrivers: string[] = [];
  const negativeDrivers: string[] = [];
  // Sort by distance from the neutral midpoint so the most decisive
  // components surface first.
  const ranked = [...components].sort(
    (a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50),
  );
  for (const c of ranked) {
    if (c.value >= strong && positiveDrivers.length < 4) {
      positiveDrivers.push(`${c.label} (${Math.round(c.value)})`);
    } else if (c.value <= weak && negativeDrivers.length < 4) {
      negativeDrivers.push(`${c.label} (${Math.round(c.value)})`);
    }
  }
  return { positiveDrivers, negativeDrivers };
}

export function confidenceFrom(evidenceScore: number): ConfidenceLevel {
  return confidenceForScore(evidenceScore);
}

export { bandForScore };
