import { describe, it, expect } from "vitest";
import {
  modelScenario,
  scoreAssessment,
  scenarioVariants,
} from "../lib/scoring/commercial";
import { assessmentSchema, scenarioSchema } from "../lib/validation/assessment";
import { seedInputs } from "../lib/demo/fixtures";
describe("Commercial financial model", () => {
  const input = seedInputs()[0];
  it("calculates baseline contribution from all operating costs", () => {
    expect(modelScenario(input.baseline, input.scenario).baseProfit).toBe(
      111000,
    );
  });
  it("treats recurring revenue as additional and counts operating changes once", () => {
    const f = modelScenario(input.baseline, input.scenario);
    expect(f.revenue).toBe(678000);
    expect(f.costs).toBe(502600);
    expect(f.uplift).toBe(64400);
    expect(f.cashRequirement).toBe(138000);
    expect(f.paybackMonths).toBe(25.71);
  });
  it("does not show payback for a loss-making circular intervention", () => {
    const f = modelScenario(input.baseline, {
      ...input.scenario,
      revenueChange: -80,
      recurringRevenue: 0,
    });
    expect(f.uplift).toBeLessThan(0);
    expect(f.paybackMonths).toBeNull();
  });
  it("responds consistently to material savings", () => {
    const low = modelScenario(input.baseline, input.scenario),
      high = modelScenario(input.baseline, {
        ...input.scenario,
        materialSaving: 35,
      });
    expect(high.profit).toBeGreaterThan(low.profit);
    expect(high.paybackMonths!).toBeLessThan(low.paybackMonths!);
    expect(
      scoreAssessment(input.factors, input.baseline, {
        ...input.scenario,
        materialSaving: 35,
      })[0].score,
    ).toBeGreaterThan(
      scoreAssessment(input.factors, input.baseline, input.scenario)[0].score,
    );
  });
  it("does not turn a retention assumption into extra revenue", () => {
    const a = modelScenario(input.baseline, input.scenario),
      b = modelScenario(input.baseline, { ...input.scenario, retention: 100 });
    expect(a.revenue).toBe(b.revenue);
  });
  it("includes residual value exactly once at year 3", () => {
    const f = modelScenario(input.baseline, input.scenario);
    expect(f.cashflow[3].incremental).toBe(f.threeYearNetValue);
    expect(f.cashflow[0].incremental).toBe(-f.cashRequirement);
  });
  it("handles zero revenue without a non-finite margin", () => {
    const b = {
      revenue: 0,
      material: 0,
      labour: 0,
      energy: 0,
      maintenance: 0,
      overhead: 0,
    };
    expect(
      modelScenario(b, { ...input.scenario, recurringRevenue: 0 }).grossMargin,
    ).toBe(0);
  });
});
describe("Explainable scores and validation", () => {
  it("every score has normalised weights and is bounded", () => {
    for (const i of seedInputs())
      for (const s of scoreAssessment(i.factors, i.baseline, i.scenario)) {
        expect(s.components.reduce((a, c) => a + c.weight, 0)).toBeCloseTo(1);
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
        expect(s.positive.length).toBeGreaterThan(0);
      }
  });
  it("supplier concentration reduces resilience", () => {
    const i = seedInputs()[0];
    expect(
      scoreAssessment(
        { ...i.factors, supplierConcentration: 100 },
        i.baseline,
        i.scenario,
      )[1].score,
    ).toBeLessThan(
      scoreAssessment(
        { ...i.factors, supplierConcentration: 0 },
        i.baseline,
        i.scenario,
      )[1].score,
    );
  });
  it("rejects non-finite, negative and out-of-range financial inputs", () => {
    const s = seedInputs()[0].scenario;
    for (const invalid of [
      { capex: -1 },
      { materialSaving: 101 },
      { extraOperating: NaN },
      { revenueChange: Infinity },
      { residualValue: s.capex + 1 },
    ])
      expect(scenarioSchema.safeParse({ ...s, ...invalid }).success).toBe(
        false,
      );
  });
  it("rejects missing evidence text and empty circular model selection", () => {
    const i = seedInputs()[0];
    expect(
      assessmentSchema.safeParse({ ...i, businessModel: [] }).success,
    ).toBe(false);
    expect(
      assessmentSchema.safeParse({ ...i, customerEvidence: "" }).success,
    ).toBe(false);
  });
  it("seeds 12 coherent businesses across 10 sectors with stable values", () => {
    const a = seedInputs(),
      b = seedInputs();
    expect(a).toEqual(b);
    expect(a).toHaveLength(12);
    expect(new Set(a.map((x) => x.sector)).size).toBe(10);
    for (const i of a) {
      expect(assessmentSchema.safeParse(i).success).toBe(true);
      for (const s of scenarioVariants(i.scenario))
        expect(scenarioSchema.safeParse(s.input).success).toBe(true);
    }
  });
  it("downside and upside scenarios preserve distinct financial outcomes", () => {
    for (const i of seedInputs()) {
      const variants = scenarioVariants(i.scenario).map((s) =>
        modelScenario(i.baseline, s.input),
      );
      expect(variants[1].profit).toBeGreaterThan(variants[0].profit);
      expect(variants[2].profit).toBeLessThan(variants[0].profit);
    }
  });
});
