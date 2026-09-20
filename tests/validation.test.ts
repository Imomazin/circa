import { describe, it, expect } from "vitest";
import {
  scenarioAssumptionsSchema,
  updateScenarioSchema,
  assessmentInputsSchema,
  resetDemoSchema,
} from "@/lib/validation";

const validAssumptions = {
  revenueDeltaPct: 15,
  materialCostDeltaPct: -10,
  energyCostDeltaPct: 5,
  labourCostDeltaPct: 8,
  opexDeltaPct: 5,
  maintenanceDeltaPct: 10,
  capex: 200000,
  workingCapitalDelta: 50000,
  recurringRevenueSharePct: 40,
  customerRetentionPct: 80,
  residualValue: 60000,
};

describe("scenarioAssumptionsSchema", () => {
  it("accepts valid assumptions", () => {
    expect(scenarioAssumptionsSchema.safeParse(validAssumptions).success).toBe(true);
  });
  it("rejects out-of-range percentage shares", () => {
    expect(scenarioAssumptionsSchema.safeParse({ ...validAssumptions, recurringRevenueSharePct: 140 }).success).toBe(false);
  });
  it("rejects negative capex", () => {
    expect(scenarioAssumptionsSchema.safeParse({ ...validAssumptions, capex: -1 }).success).toBe(false);
  });
});

describe("updateScenarioSchema", () => {
  it("accepts a valid scenario update", () => {
    const res = updateScenarioSchema.safeParse({
      assessmentId: "caledon-furniture-works",
      scenarioType: "circular_base",
      assumptions: validAssumptions,
    });
    expect(res.success).toBe(true);
  });
  it("rejects an unknown scenario type", () => {
    const res = updateScenarioSchema.safeParse({
      assessmentId: "x",
      scenarioType: "sideways",
      assumptions: validAssumptions,
    });
    expect(res.success).toBe(false);
  });
});

describe("assessmentInputsSchema", () => {
  it("rejects ratings above 100", () => {
    const res = assessmentInputsSchema.safeParse({ marketAttractiveness: 120 });
    expect(res.success).toBe(false);
  });
  it("rejects payback beyond the allowed range", () => {
    // build a full object then break one field
    const full: Record<string, number> = {};
    for (const key of Object.keys(assessmentInputsSchema.shape)) full[key] = 50;
    full.capexRequirement = 100000;
    full.annualRevenueUplift = 100000;
    full.annualCostSaving = 50000;
    full.paybackYears = 40;
    expect(assessmentInputsSchema.safeParse(full).success).toBe(false);
    full.paybackYears = 3;
    expect(assessmentInputsSchema.safeParse(full).success).toBe(true);
  });
});

describe("resetDemoSchema", () => {
  it("only accepts the literal RESET confirmation", () => {
    expect(resetDemoSchema.safeParse({ confirm: "RESET" }).success).toBe(true);
    expect(resetDemoSchema.safeParse({ confirm: "reset" }).success).toBe(false);
  });
});
