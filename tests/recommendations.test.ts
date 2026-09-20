import { describe, it, expect } from "vitest";
import { generateRecommendations } from "@/domain/recommendations/engine";
import { computeScores } from "@/domain/scoring";
import type { AssessmentInputs } from "@/domain/scoring/types";

function inputs(overrides: Partial<AssessmentInputs> = {}): AssessmentInputs {
  const base: AssessmentInputs = {
    marketAttractiveness: 60, customerDemand: 60, revenuePotential: 60, marginPotential: 60,
    scalability: 60, operationalFeasibility: 70, capexRequirement: 200000, annualRevenueUplift: 200000,
    annualCostSaving: 100000, paybackYears: 2, commercialRisk: 40, resourceExposure: 40,
    supplierConcentration: 40, materialDependency: 40, importExposure: 40, resourcePriceVolatility: 40,
    substitutionOptions: 60, repairability: 60, reuseOpportunity: 60, revenueDiversity: 60,
    recurringRevenueShare: 60, customerRetention: 70, operationalFlexibility: 60, customerEvidence: 70,
    marketValidation: 70, commercialTraction: 70, unitEconomics: 70, managementCapability: 70,
    operatingCapability: 70, capitalClarity: 70, riskUnderstanding: 70, circularPropositionClarity: 70,
    dataQuality: 70, materialRecoveryPotential: 70, lifetimeExtensionPotential: 70,
    circularRevenueModelStrength: 70, supplyChainBenefit: 70, resourceSecurityBenefit: 70,
    evidenceCoverage: 70, evidenceRecency: 70, evidenceIndependence: 70, evidenceVerification: 70,
  };
  return { ...base, ...overrides };
}

const AT = "2026-09-01T00:00:00.000Z";

describe("generateRecommendations", () => {
  it("produces no high-priority demand action for a strong, well-evidenced case", () => {
    const i = inputs();
    const recs = generateRecommendations(i, computeScores(i, AT));
    expect(recs.find((r) => r.code === "VALIDATE_DEMAND")).toBeUndefined();
  });

  it("recommends validating demand when demand and evidence are weak", () => {
    const i = inputs({ customerDemand: 40, customerEvidence: 40 });
    const recs = generateRecommendations(i, computeScores(i, AT));
    expect(recs.find((r) => r.code === "VALIDATE_DEMAND")).toBeDefined();
  });

  it("recommends reducing supplier concentration when high", () => {
    const i = inputs({ supplierConcentration: 80 });
    const recs = generateRecommendations(i, computeScores(i, AT));
    const r = recs.find((x) => x.code === "REDUCE_SUPPLIER_CONCENTRATION");
    expect(r).toBeDefined();
    expect(r!.priority).toBe("High");
  });

  it("recommends reducing capex when payback is long", () => {
    const i = inputs({ paybackYears: 6 });
    const recs = generateRecommendations(i, computeScores(i, AT));
    expect(recs.find((r) => r.code === "REDUCE_CAPEX")).toBeDefined();
  });

  it("orders recommendations by priority (High first)", () => {
    const i = inputs({ customerDemand: 30, supplierConcentration: 80, unitEconomics: 40, operationalFeasibility: 40 });
    const recs = generateRecommendations(i, computeScores(i, AT));
    const order = { High: 0, Medium: 1, Low: 2 } as const;
    for (let k = 1; k < recs.length; k++) {
      expect(order[recs[k].priority]).toBeGreaterThanOrEqual(order[recs[k - 1].priority]);
    }
  });

  it("is deterministic", () => {
    const i = inputs({ supplierConcentration: 80 });
    const a = generateRecommendations(i, computeScores(i, AT));
    const b = generateRecommendations(i, computeScores(i, AT));
    expect(a).toEqual(b);
  });
});
