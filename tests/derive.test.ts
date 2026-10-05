import { describe, it, expect } from "vitest";
import { deriveScenarioAssumptions } from "@/domain/scenarios/derive";
import { NEUTRAL_CIRCULAR } from "@/domain/scoring/defaults";
import type { FinancialBaseline } from "@/domain/scenarios/model";

const baseline: FinancialBaseline = {
  revenue: 2_000_000,
  materialCost: 600_000,
  energyCost: 150_000,
  labourCost: 500_000,
  opex: 200_000,
  maintenanceCost: 90_000,
  workingCapital: 250_000,
};

describe("deriveScenarioAssumptions", () => {
  const set = deriveScenarioAssumptions(baseline, NEUTRAL_CIRCULAR);

  it("produces all four scenario types", () => {
    expect(Object.keys(set).sort()).toEqual(["baseline", "circular_base", "downside", "upside"]);
  });

  it("baseline is the do-nothing case (no deltas, no capex)", () => {
    expect(set.baseline.revenueDeltaPct).toBe(0);
    expect(set.baseline.materialCostDeltaPct).toBe(0);
    expect(set.baseline.capex).toBe(0);
  });

  it("circular_base passes the circular assumptions through unchanged", () => {
    expect(set.circular_base).toEqual(NEUTRAL_CIRCULAR);
  });

  it("upside is more favourable than the circular base", () => {
    expect(set.upside.revenueDeltaPct).toBeGreaterThan(set.circular_base.revenueDeltaPct);
    expect(set.upside.materialCostDeltaPct).toBeLessThan(set.circular_base.materialCostDeltaPct);
  });

  it("downside is less favourable and raises capex", () => {
    expect(set.downside.revenueDeltaPct).toBeLessThan(set.circular_base.revenueDeltaPct);
    expect(set.downside.capex).toBeGreaterThanOrEqual(set.circular_base.capex);
  });

  it("keeps percentage shares within 0–100", () => {
    for (const s of Object.values(set)) {
      expect(s.recurringRevenueSharePct).toBeGreaterThanOrEqual(0);
      expect(s.recurringRevenueSharePct).toBeLessThanOrEqual(100);
      expect(s.customerRetentionPct).toBeGreaterThanOrEqual(0);
      expect(s.customerRetentionPct).toBeLessThanOrEqual(100);
    }
  });
});
