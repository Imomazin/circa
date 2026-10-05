import { describe, it, expect } from "vitest";
import {
  getMatches,
  networkTotals,
  familyAggregates,
  pipelineCounts,
} from "@/domain/network/engine";
import { MATERIAL_STREAMS } from "@/domain/network/data";
import { PIPELINE_STAGES } from "@/domain/network/types";
import { BUSINESSES } from "@/db/seed-data";

const ORG_IDS = new Set(BUSINESSES.map((b) => b.id));
const STREAM_IDS = new Set(MATERIAL_STREAMS.map((s) => s.id));

describe("circular network engine", () => {
  const matches = getMatches();

  it("produces matches", () => {
    expect(matches.length).toBeGreaterThan(8);
  });

  it("is internally consistent — every match references real orgs and streams", () => {
    for (const m of matches) {
      expect(ORG_IDS.has(m.supplierId)).toBe(true);
      expect(ORG_IDS.has(m.buyerId)).toBe(true);
      expect(STREAM_IDS.has(m.supplyStreamId)).toBe(true);
      expect(STREAM_IDS.has(m.demandStreamId)).toBe(true);
      expect(m.supplierId).not.toBe(m.buyerId);
    }
  });

  it("only pairs streams of the same material family, supply to demand", () => {
    const byId = new Map(MATERIAL_STREAMS.map((s) => [s.id, s]));
    for (const m of matches) {
      const supply = byId.get(m.supplyStreamId)!;
      const demand = byId.get(m.demandStreamId)!;
      expect(supply.direction).toBe("supply");
      expect(demand.direction).toBe("demand");
      expect(supply.family).toBe(demand.family);
      expect(m.family).toBe(supply.family);
    }
  });

  it("keeps strength in range and value/carbon positive", () => {
    for (const m of matches) {
      expect(m.strength).toBeGreaterThanOrEqual(0);
      expect(m.strength).toBeLessThanOrEqual(100);
      expect(m.value).toBeGreaterThan(0);
      expect(m.carbonTonnes).toBeGreaterThanOrEqual(0);
      expect(m.volumeTonnes).toBeGreaterThan(0);
      expect(m.constraints.length).toBeGreaterThan(0);
    }
  });

  it("matched volume never exceeds either stream's volume", () => {
    const byId = new Map(MATERIAL_STREAMS.map((s) => [s.id, s]));
    for (const m of matches) {
      const supply = byId.get(m.supplyStreamId)!;
      const demand = byId.get(m.demandStreamId)!;
      expect(m.volumeTonnes).toBeLessThanOrEqual(supply.annualVolumeTonnes);
      expect(m.volumeTonnes).toBeLessThanOrEqual(demand.annualVolumeTonnes);
    }
  });

  it("assigns every match to a valid pipeline stage and spans the funnel", () => {
    const stages = new Set(matches.map((m) => m.stage));
    for (const m of matches) expect(PIPELINE_STAGES).toContain(m.stage);
    // A believable programme touches several stages, not just one.
    expect(stages.size).toBeGreaterThanOrEqual(5);
    const counts = pipelineCounts();
    expect(counts.reduce((n, c) => n + c.count, 0)).toBe(matches.length);
  });

  it("totals aggregate the matches", () => {
    const t = networkTotals();
    expect(t.matchCount).toBe(matches.length);
    expect(t.totalValue).toBe(matches.reduce((n, m) => n + m.value, 0));
    expect(t.organisations).toBeGreaterThan(0);
  });

  it("family aggregates only include families with streams", () => {
    for (const f of familyAggregates()) {
      expect(f.supplyTonnes + f.demandTonnes).toBeGreaterThan(0);
      expect(f.matchCount).toBe(matches.filter((m) => m.family === f.family).length);
    }
  });

  it("is deterministic across calls", () => {
    expect(JSON.stringify(getMatches())).toBe(JSON.stringify(matches));
  });
});
