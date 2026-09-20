import type { ScenarioType } from "../constants";

/**
 * Financial scenario modeller.
 *
 * A small, transparent P&L engine. A business has a `FinancialBaseline`
 * (its current position). Each scenario applies a set of `ScenarioAssumptions`
 * (levers the user can edit) to that baseline and the engine recomputes a
 * coherent set of commercial outputs. All maths is deterministic and shown in
 * docs/methodology.md — nothing here is a black box.
 */

export interface FinancialBaseline {
  /** Current annual revenue, GBP. */
  revenue: number;
  /** Current annual material cost, GBP. */
  materialCost: number;
  /** Current annual energy / resource cost, GBP. */
  energyCost: number;
  /** Current annual labour cost, GBP. */
  labourCost: number;
  /** Current annual other operating expenditure, GBP. */
  opex: number;
  /** Current annual maintenance cost, GBP. */
  maintenanceCost: number;
  /** Current working capital, GBP. */
  workingCapital: number;
}

export interface ScenarioAssumptions {
  /** Revenue change vs baseline, as a percentage (e.g. +18 = +18%). */
  revenueDeltaPct: number;
  /** Material cost change vs baseline, percentage. */
  materialCostDeltaPct: number;
  /** Energy/resource cost change vs baseline, percentage. */
  energyCostDeltaPct: number;
  /** Labour cost change vs baseline, percentage. */
  labourCostDeltaPct: number;
  /** Other opex change vs baseline, percentage. */
  opexDeltaPct: number;
  /** Maintenance cost change vs baseline, percentage. */
  maintenanceDeltaPct: number;
  /** One-off capital expenditure required, GBP. */
  capex: number;
  /** Working-capital change vs baseline, GBP (can be negative). */
  workingCapitalDelta: number;
  /** Share of scenario revenue that is recurring, percentage 0-100. */
  recurringRevenueSharePct: number;
  /** Assumed customer retention, percentage 0-100. */
  customerRetentionPct: number;
  /** Residual / resale value of circular assets, GBP. */
  residualValue: number;
}

export interface ScenarioResult {
  revenue: number;
  materialCost: number;
  energyCost: number;
  labourCost: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingCosts: number;
  ebitda: number;
  ebitdaMarginPct: number;
  recurringRevenue: number;
  capex: number;
  cashRequirement: number;
  /** Incremental annual EBITDA vs the current baseline. */
  annualBenefitVsBaseline: number;
  /** Simple payback of capex from incremental benefit, years (null if n/a). */
  paybackYears: number | null;
  customerRetentionPct: number;
  residualValue: number;
}

function pct(base: number, deltaPct: number): number {
  return base * (1 + deltaPct / 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Compute a single scenario result from a baseline + assumptions. */
export function computeScenario(
  baseline: FinancialBaseline,
  assumptions: ScenarioAssumptions,
  baselineEbitda?: number,
): ScenarioResult {
  const revenue = pct(baseline.revenue, assumptions.revenueDeltaPct);
  const materialCost = pct(baseline.materialCost, assumptions.materialCostDeltaPct);
  const energyCost = pct(baseline.energyCost, assumptions.energyCostDeltaPct);
  const labourCost = pct(baseline.labourCost, assumptions.labourCostDeltaPct);
  const cogs = materialCost + energyCost + labourCost;
  const grossProfit = revenue - cogs;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const opex = pct(baseline.opex, assumptions.opexDeltaPct);
  const maintenanceCost = pct(baseline.maintenanceCost, assumptions.maintenanceDeltaPct);
  const operatingCosts = opex + maintenanceCost;
  const ebitda = grossProfit - operatingCosts;
  const ebitdaMarginPct = revenue > 0 ? (ebitda / revenue) * 100 : 0;

  const recurringRevenue = revenue * (assumptions.recurringRevenueSharePct / 100);
  const cashRequirement = assumptions.capex + assumptions.workingCapitalDelta;

  const refEbitda =
    baselineEbitda ??
    baseline.revenue -
      (baseline.materialCost + baseline.energyCost + baseline.labourCost) -
      (baseline.opex + baseline.maintenanceCost);
  const annualBenefitVsBaseline = ebitda - refEbitda;

  let paybackYears: number | null = null;
  if (assumptions.capex > 0 && annualBenefitVsBaseline > 0) {
    paybackYears = round2(assumptions.capex / annualBenefitVsBaseline);
  }

  return {
    revenue: round2(revenue),
    materialCost: round2(materialCost),
    energyCost: round2(energyCost),
    labourCost: round2(labourCost),
    cogs: round2(cogs),
    grossProfit: round2(grossProfit),
    grossMarginPct: round2(grossMarginPct),
    operatingCosts: round2(operatingCosts),
    ebitda: round2(ebitda),
    ebitdaMarginPct: round2(ebitdaMarginPct),
    recurringRevenue: round2(recurringRevenue),
    capex: round2(assumptions.capex),
    cashRequirement: round2(cashRequirement),
    annualBenefitVsBaseline: round2(annualBenefitVsBaseline),
    paybackYears,
    customerRetentionPct: assumptions.customerRetentionPct,
    residualValue: round2(assumptions.residualValue),
  };
}

/** The "do nothing" assumptions that reproduce the baseline exactly. */
export function baselineAssumptions(baseline: FinancialBaseline): ScenarioAssumptions {
  return {
    revenueDeltaPct: 0,
    materialCostDeltaPct: 0,
    energyCostDeltaPct: 0,
    labourCostDeltaPct: 0,
    opexDeltaPct: 0,
    maintenanceDeltaPct: 0,
    capex: 0,
    workingCapitalDelta: 0,
    recurringRevenueSharePct: 0,
    customerRetentionPct: 70,
    residualValue: 0,
  };
}

/** Compute the baseline EBITDA so scenarios can be compared against it. */
export function baselineEbitda(baseline: FinancialBaseline): number {
  return round2(
    baseline.revenue -
      (baseline.materialCost + baseline.energyCost + baseline.labourCost) -
      (baseline.opex + baseline.maintenanceCost),
  );
}

export interface ScenarioSet {
  baseline: ScenarioResult;
  circular_base: ScenarioResult;
  upside: ScenarioResult;
  downside: ScenarioResult;
}

/** Compute all four scenarios from a baseline + per-scenario assumptions. */
export function computeScenarioSet(
  baseline: FinancialBaseline,
  assumptions: Record<ScenarioType, ScenarioAssumptions>,
): ScenarioSet {
  const ref = baselineEbitda(baseline);
  return {
    baseline: computeScenario(baseline, assumptions.baseline, ref),
    circular_base: computeScenario(baseline, assumptions.circular_base, ref),
    upside: computeScenario(baseline, assumptions.upside, ref),
    downside: computeScenario(baseline, assumptions.downside, ref),
  };
}
