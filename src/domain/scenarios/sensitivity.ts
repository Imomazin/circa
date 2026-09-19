import {
  computeScenario,
  type FinancialBaseline,
  type ScenarioAssumptions,
  type ScenarioResult,
} from "./model";

/**
 * Sensitivity analysis.
 *
 * Applies a single, named shock to a scenario's assumptions and reports how the
 * key commercial outputs respond. Transparent by design: each shock is a plain
 * transformation of one assumption.
 */

export interface SensitivityShock {
  key: string;
  label: string;
  apply: (a: ScenarioAssumptions) => ScenarioAssumptions;
}

export const STANDARD_SHOCKS: SensitivityShock[] = [
  {
    key: "material_up_10",
    label: "Material costs +10%",
    apply: (a) => ({ ...a, materialCostDeltaPct: a.materialCostDeltaPct + 10 }),
  },
  {
    key: "uptake_down_10",
    label: "Customer uptake -10%",
    apply: (a) => ({ ...a, revenueDeltaPct: a.revenueDeltaPct - 10 }),
  },
  {
    key: "capex_up_15",
    label: "Capex +15%",
    apply: (a) => ({ ...a, capex: a.capex * 1.15 }),
  },
  {
    key: "retention_up_5",
    label: "Retention +5pts",
    apply: (a) => ({
      ...a,
      customerRetentionPct: Math.min(100, a.customerRetentionPct + 5),
    }),
  },
  {
    key: "recurring_up_10",
    label: "Recurring-revenue adoption +10pts",
    apply: (a) => ({
      ...a,
      recurringRevenueSharePct: Math.min(100, a.recurringRevenueSharePct + 10),
    }),
  },
  {
    key: "energy_up_20",
    label: "Energy/resource costs +20%",
    apply: (a) => ({ ...a, energyCostDeltaPct: a.energyCostDeltaPct + 20 }),
  },
];

export interface SensitivityRow {
  key: string;
  label: string;
  ebitda: number;
  ebitdaDelta: number;
  paybackYears: number | null;
  grossMarginPct: number;
  marginDelta: number;
}

/**
 * Run all standard shocks against a scenario and report deltas vs the
 * unshocked result.
 */
export function runSensitivity(
  baseline: FinancialBaseline,
  assumptions: ScenarioAssumptions,
  baselineEbitdaRef: number,
  shocks: SensitivityShock[] = STANDARD_SHOCKS,
): { base: ScenarioResult; rows: SensitivityRow[] } {
  const base = computeScenario(baseline, assumptions, baselineEbitdaRef);
  const rows = shocks.map((shock) => {
    const shocked = computeScenario(baseline, shock.apply(assumptions), baselineEbitdaRef);
    return {
      key: shock.key,
      label: shock.label,
      ebitda: shocked.ebitda,
      ebitdaDelta: Math.round((shocked.ebitda - base.ebitda) * 100) / 100,
      paybackYears: shocked.paybackYears,
      grossMarginPct: shocked.grossMarginPct,
      marginDelta: Math.round((shocked.grossMarginPct - base.grossMarginPct) * 100) / 100,
    };
  });
  return { base, rows };
}
