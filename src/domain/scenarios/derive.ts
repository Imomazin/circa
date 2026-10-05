import {
  baselineAssumptions,
  type FinancialBaseline,
  type ScenarioAssumptions,
} from "./model";
import type { ScenarioType } from "../constants";

/**
 * Derive the four standard scenario assumption sets from a baseline and a
 * circular-case assumption. Shared by the deterministic seed and the in-app
 * "new business" creation flow so both produce identical scenario shapes.
 *
 *  - baseline     — "do nothing" (reproduces the current position)
 *  - circular_base — the provided circular case
 *  - upside       — circular case with a more favourable demand/cost mix
 *  - downside     — circular case stressed on demand, cost and capital
 */
export function deriveScenarioAssumptions(
  baseline: FinancialBaseline,
  circular: ScenarioAssumptions,
): Record<ScenarioType, ScenarioAssumptions> {
  return {
    baseline: baselineAssumptions(baseline),
    circular_base: circular,
    upside: {
      ...circular,
      revenueDeltaPct: circular.revenueDeltaPct + 8,
      materialCostDeltaPct: circular.materialCostDeltaPct - 3,
      recurringRevenueSharePct: Math.min(100, circular.recurringRevenueSharePct + 8),
      customerRetentionPct: Math.min(100, circular.customerRetentionPct + 5),
    },
    downside: {
      ...circular,
      revenueDeltaPct: circular.revenueDeltaPct - 12,
      materialCostDeltaPct: circular.materialCostDeltaPct + 8,
      energyCostDeltaPct: circular.energyCostDeltaPct + 6,
      capex: Math.round(circular.capex * 1.1),
      customerRetentionPct: Math.max(0, circular.customerRetentionPct - 8),
    },
  };
}
