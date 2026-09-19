import { describe, it, expect } from "vitest";
import {
  computeScenario,
  computeScenarioSet,
  baselineAssumptions,
  baselineEbitda,
  type FinancialBaseline,
  type ScenarioAssumptions,
} from "@/domain/scenarios/model";
import { runSensitivity, STANDARD_SHOCKS } from "@/domain/scenarios/sensitivity";

const baseline: FinancialBaseline = {
  revenue: 1_000_000,
  materialCost: 400_000,
  energyCost: 100_000,
  labourCost: 200_000,
  opex: 100_000,
  maintenanceCost: 50_000,
  workingCapital: 150_000,
};

const doNothing = baselineAssumptions(baseline);

describe("computeScenario", () => {
  it("reproduces the baseline with do-nothing assumptions", () => {
    const r = computeScenario(baseline, doNothing);
    expect(r.revenue).toBe(1_000_000);
    expect(r.ebitda).toBe(150_000); // 1,000,000 - 700,000 COGS - 150,000 opex
    expect(r.annualBenefitVsBaseline).toBe(0);
    expect(r.paybackYears).toBeNull();
  });

  it("computes gross margin correctly", () => {
    const r = computeScenario(baseline, doNothing);
    // gross profit = 1,000,000 - 700,000 = 300,000 -> 30%
    expect(r.grossMarginPct).toBeCloseTo(30, 5);
  });

  it("applies revenue and cost deltas", () => {
    const a: ScenarioAssumptions = { ...doNothing, revenueDeltaPct: 20, materialCostDeltaPct: -10 };
    const r = computeScenario(baseline, a);
    expect(r.revenue).toBe(1_200_000);
    expect(r.materialCost).toBe(360_000);
  });

  it("computes payback from capex and incremental benefit", () => {
    const a: ScenarioAssumptions = { ...doNothing, revenueDeltaPct: 20, capex: 300_000 };
    const r = computeScenario(baseline, a);
    // new EBITDA = 1,200,000 - 700,000 - 150,000 = 350,000; benefit = 200,000
    expect(r.annualBenefitVsBaseline).toBe(200_000);
    expect(r.paybackYears).toBeCloseTo(1.5, 5);
  });

  it("returns null payback when there is no incremental benefit", () => {
    const a: ScenarioAssumptions = { ...doNothing, capex: 100_000 };
    const r = computeScenario(baseline, a);
    expect(r.paybackYears).toBeNull();
  });

  it("computes recurring revenue and cash requirement", () => {
    const a: ScenarioAssumptions = { ...doNothing, recurringRevenueSharePct: 40, capex: 100_000, workingCapitalDelta: 25_000 };
    const r = computeScenario(baseline, a);
    expect(r.recurringRevenue).toBe(400_000);
    expect(r.cashRequirement).toBe(125_000);
  });
});

describe("baselineEbitda", () => {
  it("matches the do-nothing scenario EBITDA", () => {
    expect(baselineEbitda(baseline)).toBe(150_000);
  });
});

describe("computeScenarioSet", () => {
  it("computes all four scenarios against a shared baseline EBITDA", () => {
    const set = computeScenarioSet(baseline, {
      baseline: doNothing,
      circular_base: { ...doNothing, revenueDeltaPct: 15, capex: 200_000 },
      upside: { ...doNothing, revenueDeltaPct: 25, capex: 200_000 },
      downside: { ...doNothing, revenueDeltaPct: 5, capex: 220_000 },
    });
    expect(set.baseline.annualBenefitVsBaseline).toBe(0);
    expect(set.upside.ebitda).toBeGreaterThan(set.circular_base.ebitda);
    expect(set.circular_base.ebitda).toBeGreaterThan(set.downside.ebitda);
  });
});

describe("runSensitivity", () => {
  const circular: ScenarioAssumptions = { ...doNothing, revenueDeltaPct: 15, capex: 200_000 };

  it("returns a row per standard shock", () => {
    const { rows } = runSensitivity(baseline, circular, baselineEbitda(baseline));
    expect(rows).toHaveLength(STANDARD_SHOCKS.length);
  });

  it("material cost +10% reduces EBITDA", () => {
    const { rows } = runSensitivity(baseline, circular, baselineEbitda(baseline));
    const material = rows.find((r) => r.key === "material_up_10");
    expect(material).toBeDefined();
    expect(material!.ebitdaDelta).toBeLessThan(0);
  });

  it("customer uptake -10% reduces EBITDA", () => {
    const { rows } = runSensitivity(baseline, circular, baselineEbitda(baseline));
    const uptake = rows.find((r) => r.key === "uptake_down_10");
    expect(uptake!.ebitdaDelta).toBeLessThan(0);
  });
});
