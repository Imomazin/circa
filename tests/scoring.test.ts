import { describe, it, expect } from "vitest";
import { computeScores, headlineScore } from "@/domain/scoring";
import { scoreViability } from "@/domain/scoring/viability";
import { scoreResilience } from "@/domain/scoring/resilience";
import { scoreInvestor } from "@/domain/scoring/investor";
import { bandForScore, confidenceForScore } from "@/domain/constants";
import type { AssessmentInputs } from "@/domain/scoring/types";

const AT = "2026-09-01T00:00:00.000Z";

function inputs(overrides: Partial<AssessmentInputs> = {}): AssessmentInputs {
  const base: AssessmentInputs = {
    marketAttractiveness: 60, customerDemand: 60, revenuePotential: 60, marginPotential: 60,
    scalability: 60, operationalFeasibility: 60, capexRequirement: 200000, annualRevenueUplift: 150000,
    annualCostSaving: 100000, paybackYears: 3, commercialRisk: 40, resourceExposure: 40,
    supplierConcentration: 40, materialDependency: 40, importExposure: 40, resourcePriceVolatility: 40,
    substitutionOptions: 60, repairability: 60, reuseOpportunity: 60, revenueDiversity: 60,
    recurringRevenueShare: 40, customerRetention: 70, operationalFlexibility: 60, customerEvidence: 60,
    marketValidation: 60, commercialTraction: 60, unitEconomics: 60, managementCapability: 60,
    operatingCapability: 60, capitalClarity: 60, riskUnderstanding: 60, circularPropositionClarity: 60,
    dataQuality: 60, materialRecoveryPotential: 60, lifetimeExtensionPotential: 60,
    circularRevenueModelStrength: 60, supplyChainBenefit: 60, resourceSecurityBenefit: 60,
    evidenceCoverage: 60, evidenceRecency: 60, evidenceIndependence: 60, evidenceVerification: 60,
  };
  return { ...base, ...overrides };
}

describe("bandForScore", () => {
  it("maps score ranges to the correct bands", () => {
    expect(bandForScore(85)).toBe("Compelling");
    expect(bandForScore(70)).toBe("Strong");
    expect(bandForScore(55)).toBe("Developing");
    expect(bandForScore(40)).toBe("Emerging");
    expect(bandForScore(20)).toBe("Weak");
  });
  it("respects band boundaries", () => {
    expect(bandForScore(80)).toBe("Compelling");
    expect(bandForScore(79.9)).toBe("Strong");
    expect(bandForScore(35)).toBe("Emerging");
    expect(bandForScore(34.9)).toBe("Weak");
  });
});

describe("confidenceForScore", () => {
  it("maps evidence score to confidence level", () => {
    expect(confidenceForScore(80)).toBe("High");
    expect(confidenceForScore(50)).toBe("Moderate");
    expect(confidenceForScore(30)).toBe("Low");
  });
});

describe("computeScores", () => {
  it("is deterministic for the same inputs and timestamp", () => {
    const a = computeScores(inputs(), AT);
    const b = computeScores(inputs(), AT);
    expect(a).toEqual(b);
  });

  it("returns all five dimensions with 0-100 scores", () => {
    const s = computeScores(inputs(), AT);
    for (const dim of [s.viability, s.resilience, s.investor, s.opportunity, s.evidence]) {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
      expect(dim.calculatedAt).toBe(AT);
    }
  });

  it("attaches evidence-derived confidence to every dimension", () => {
    const strong = computeScores(inputs({ evidenceCoverage: 90, evidenceRecency: 90, evidenceIndependence: 90, evidenceVerification: 90 }), AT);
    expect(strong.evidence.confidence).toBe("High");
    expect(strong.viability.confidence).toBe("High");

    const weak = computeScores(inputs({ evidenceCoverage: 20, evidenceRecency: 20, evidenceIndependence: 20, evidenceVerification: 20 }), AT);
    expect(weak.evidence.confidence).toBe("Low");
    expect(weak.viability.confidence).toBe("Low");
  });

  it("component weights within a dimension sum to 1", () => {
    const s = computeScores(inputs(), AT);
    for (const dim of [s.viability, s.resilience, s.investor, s.opportunity, s.evidence]) {
      const total = dim.components.reduce((a, c) => a + c.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });
});

describe("scoreViability", () => {
  it("rewards low capital intensity and fast payback", () => {
    const cheap = scoreViability(inputs({ capexRequirement: 100000, paybackYears: 1 }), 60, AT);
    const heavy = scoreViability(inputs({ capexRequirement: 3000000, paybackYears: 8 }), 60, AT);
    expect(cheap.score).toBeGreaterThan(heavy.score);
  });

  it("penalises high commercial risk", () => {
    const lowRisk = scoreViability(inputs({ commercialRisk: 10 }), 60, AT);
    const highRisk = scoreViability(inputs({ commercialRisk: 90 }), 60, AT);
    expect(lowRisk.score).toBeGreaterThan(highRisk.score);
  });
});

describe("scoreResilience", () => {
  it("penalises supplier concentration and rewards recurring revenue", () => {
    const resilient = scoreResilience(inputs({ supplierConcentration: 10, recurringRevenueShare: 80 }), 60, AT);
    const fragile = scoreResilience(inputs({ supplierConcentration: 90, recurringRevenueShare: 5 }), 60, AT);
    expect(resilient.score).toBeGreaterThan(fragile.score);
  });

  it("flags supplier concentration as missing evidence when high", () => {
    const s = scoreResilience(inputs({ supplierConcentration: 80 }), 60, AT);
    expect(s.missingEvidence.join(" ")).toMatch(/supplier/i);
  });
});

describe("scoreInvestor", () => {
  it("rewards evidence, traction and unit economics", () => {
    const ready = scoreInvestor(inputs({ customerEvidence: 90, commercialTraction: 90, unitEconomics: 90 }), 80, AT);
    const early = scoreInvestor(inputs({ customerEvidence: 20, commercialTraction: 20, unitEconomics: 20 }), 40, AT);
    expect(ready.score).toBeGreaterThan(early.score);
  });
});

describe("headlineScore", () => {
  it("is a weighted blend within range", () => {
    const s = computeScores(inputs(), AT);
    const h = headlineScore(s);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(100);
  });
});
