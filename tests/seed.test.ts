import { describe, it, expect } from "vitest";
import { BUSINESSES, PROGRAMME_INSIGHTS } from "@/db/seed-data";
import { deriveScenarios } from "@/db/seed-core";
import { computeScores, headlineScore } from "@/domain/scoring";
import { CIRCULAR_MODELS, SECTORS, ASSESSMENT_STAGES } from "@/domain/constants";

describe("seed data integrity", () => {
  it("contains at least 10 businesses", () => {
    expect(BUSINESSES.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique slugs", () => {
    const ids = BUSINESSES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only known sectors, stages and circular models", () => {
    for (const b of BUSINESSES) {
      expect(SECTORS).toContain(b.sector as (typeof SECTORS)[number]);
      expect(ASSESSMENT_STAGES).toContain(b.stage);
      expect(b.circularModels.length).toBeGreaterThan(0);
      for (const m of b.circularModels) {
        expect(CIRCULAR_MODELS).toContain(m as (typeof CIRCULAR_MODELS)[number]);
      }
    }
  });

  it("has coherent financial baselines (positive revenue, non-negative costs)", () => {
    for (const b of BUSINESSES) {
      expect(b.baseline.revenue).toBeGreaterThan(0);
      for (const v of Object.values(b.baseline)) expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it("produces in-range scores for every business", () => {
    for (const b of BUSINESSES) {
      const bundle = computeScores(b.inputs);
      for (const dim of [bundle.viability, bundle.resilience, bundle.investor, bundle.opportunity, bundle.evidence]) {
        expect(dim.score).toBeGreaterThanOrEqual(0);
        expect(dim.score).toBeLessThanOrEqual(100);
      }
      const h = headlineScore(bundle);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(100);
    }
  });

  it("shows real variety across the cohort", () => {
    const viabilities = BUSINESSES.map((b) => computeScores(b.inputs).viability.score);
    const min = Math.min(...viabilities);
    const max = Math.max(...viabilities);
    expect(max - min).toBeGreaterThan(10);
  });

  it("derives four ordered scenarios per business", () => {
    for (const b of BUSINESSES) {
      const s = deriveScenarios(b);
      expect(Object.keys(s).sort()).toEqual(["baseline", "circular_base", "downside", "upside"]);
      // upside revenue delta should exceed circular base, which exceeds downside
      expect(s.upside.revenueDeltaPct).toBeGreaterThan(s.circular_base.revenueDeltaPct);
      expect(s.circular_base.revenueDeltaPct).toBeGreaterThan(s.downside.revenueDeltaPct);
    }
  });

  it("has programme insight rows", () => {
    expect(PROGRAMME_INSIGHTS.length).toBeGreaterThan(0);
  });
});
