import { describe, it, expect } from "vitest";
import {
  scenarioAssumptionsSchema,
  updateScenarioSchema,
  assessmentInputsSchema,
  resetDemoSchema,
  createBusinessSchema,
  addEvidenceSchema,
  deleteEvidenceSchema,
} from "@/lib/validation";
import { NEUTRAL_INPUTS, NEUTRAL_CIRCULAR } from "@/domain/scoring/defaults";

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

const validBusiness = {
  name: "Clyde Remanufacturing Co.",
  sector: "Manufacturing",
  companySize: "Small (10-49)",
  region: "Glasgow City Region",
  description: "Remanufactures industrial pumps for resale.",
  currentOperatingModel: "Linear take-make-dispose manufacturing.",
  currentRevenueModel: "One-off equipment sales.",
  productsServices: "Industrial pumps and spares.",
  customerModel: "Direct B2B sales to industrial buyers.",
  commercialPressures: "Rising material costs and warranty claims.",
  stage: "Draft",
  circularModels: ["Remanufacturing", "Take-back"],
  opportunitySummary: "Shift to remanufactured-as-new pumps.",
  commercialRationale: "Lower material cost, higher margin, recurring service revenue.",
  baseline: {
    revenue: 2_400_000,
    materialCost: 780_000,
    energyCost: 180_000,
    labourCost: 720_000,
    opex: 260_000,
    maintenanceCost: 120_000,
    workingCapital: 340_000,
  },
  circular: NEUTRAL_CIRCULAR,
  inputs: NEUTRAL_INPUTS,
};

describe("createBusinessSchema", () => {
  it("accepts a complete, valid business", () => {
    expect(createBusinessSchema.safeParse(validBusiness).success).toBe(true);
  });
  it("rejects an empty name", () => {
    expect(createBusinessSchema.safeParse({ ...validBusiness, name: "  " }).success).toBe(false);
  });
  it("rejects an unknown sector", () => {
    expect(createBusinessSchema.safeParse({ ...validBusiness, sector: "Aerospace" }).success).toBe(false);
  });
  it("requires at least one circular model", () => {
    expect(createBusinessSchema.safeParse({ ...validBusiness, circularModels: [] }).success).toBe(false);
  });
});

describe("evidence schemas", () => {
  const validEvidence = {
    assessmentId: "clyde-remanufacturing-co",
    type: "Pilot data",
    description: "Six-month pump remanufacturing pilot.",
    source: "Internal pilot report, Q2 2026",
    confidence: 72,
    linkedArea: "Commercial traction",
    status: "Provisional",
  };
  it("accepts a valid evidence item", () => {
    expect(addEvidenceSchema.safeParse(validEvidence).success).toBe(true);
  });
  it("rejects confidence outside 0–100", () => {
    expect(addEvidenceSchema.safeParse({ ...validEvidence, confidence: 120 }).success).toBe(false);
  });
  it("rejects a non-integer confidence", () => {
    expect(addEvidenceSchema.safeParse({ ...validEvidence, confidence: 72.5 }).success).toBe(false);
  });
  it("deleteEvidenceSchema requires a uuid evidenceId", () => {
    expect(deleteEvidenceSchema.safeParse({ assessmentId: "x", evidenceId: "not-a-uuid" }).success).toBe(false);
    expect(
      deleteEvidenceSchema.safeParse({
        assessmentId: "x",
        evidenceId: "123e4567-e89b-12d3-a456-426614174000",
      }).success,
    ).toBe(true);
  });
});
