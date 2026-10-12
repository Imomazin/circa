import { describe, it, expect } from "vitest";
import {
  getMatches,
  networkTotals,
  familyAggregates,
  pipelineCounts,
} from "@/domain/network/engine";
import { enterpriseStreams, enterpriseOrgs } from "@/domain/enterprise/generate";
import { PIPELINE_STAGES } from "@/domain/network/types";

const ORG_IDS = new Set(enterpriseOrgs().map((o) => o.id));
const STREAMS = enterpriseStreams();
const STREAM_BY_ID = new Map(STREAMS.map((s) => [s.id, s]));

describe("enterprise opportunity engine", () => {
  const matches = getMatches();

  it("generates a sizeable, bounded opportunity set", () => {
    expect(matches.length).toBeGreaterThan(40);
    expect(matches.length).toBeLessThanOrEqual(180);
  });

  it("references real organisations and streams, supplier ≠ buyer", () => {
    for (const m of matches) {
      expect(ORG_IDS.has(m.supplierId)).toBe(true);
      expect(ORG_IDS.has(m.buyerId)).toBe(true);
      expect(STREAM_BY_ID.has(m.supplyStreamId)).toBe(true);
      expect(STREAM_BY_ID.has(m.demandStreamId)).toBe(true);
      expect(m.supplierId).not.toBe(m.buyerId);
    }
  });

  it("only pairs same-family supply to demand, within stream volumes", () => {
    for (const m of matches) {
      const supply = STREAM_BY_ID.get(m.supplyStreamId)!;
      const demand = STREAM_BY_ID.get(m.demandStreamId)!;
      expect(supply.direction).toBe("supply");
      expect(demand.direction).toBe("demand");
      expect(supply.family).toBe(demand.family);
      expect(m.family).toBe(supply.family);
      expect(m.volumeTonnes).toBeLessThanOrEqual(supply.annualVolumeTonnes);
      expect(m.volumeTonnes).toBeLessThanOrEqual(demand.annualVolumeTonnes);
    }
  });

  it("produces a coherent, positive economic model with provenance", () => {
    for (const m of matches) {
      expect(m.netValue).toBeGreaterThan(0);
      expect(m.value).toBe(m.netValue);
      // net = gross + avoided − transport − processing
      expect(m.netValue).toBe(
        m.grossMaterialValue + m.avoidedDisposal - m.transportCost - m.processingCost,
      );
      expect(m.transportCost).toBeGreaterThanOrEqual(0);
      expect(m.processingCost).toBeGreaterThanOrEqual(0);
      expect(m.implementationCost).toBeGreaterThan(0);
      expect(m.carbonTonnes).toBeGreaterThanOrEqual(0);
      expect(m.strength).toBeGreaterThanOrEqual(0);
      expect(m.strength).toBeLessThanOrEqual(100);
      expect(m.economics.length).toBeGreaterThan(0);
      expect(m.economics.every((e) => e.source && e.source.length > 0)).toBe(true);
      expect(m.supplyConfidence).toBeGreaterThan(0);
      expect(m.demandConfidence).toBeGreaterThan(0);
    }
  });

  it("assigns every match a valid stage and spans the pipeline", () => {
    const stages = new Set(matches.map((m) => m.stage));
    for (const m of matches) expect(PIPELINE_STAGES).toContain(m.stage);
    expect(stages.size).toBeGreaterThanOrEqual(6);
    expect(pipelineCounts().reduce((n, c) => n + c.count, 0)).toBe(matches.length);
  });

  it("totals aggregate the matches", () => {
    const t = networkTotals();
    expect(t.matchCount).toBe(matches.length);
    expect(t.totalValue).toBe(matches.reduce((n, m) => n + m.value, 0));
    expect(t.organisations).toBeGreaterThan(20);
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

describe("enterprise dataset", () => {
  it("has a large, coherent organisation network", () => {
    const orgs = enterpriseOrgs();
    expect(orgs.length).toBeGreaterThanOrEqual(150);
    expect(orgs.filter((o) => o.featured).length).toBe(12);
    // every org has a unique id and a Companies House-style number
    expect(new Set(orgs.map((o) => o.id)).size).toBe(orgs.length);
    expect(orgs.every((o) => /^SC\d{6}$/.test(o.companyNumber))).toBe(true);
  });

  it("every stream belongs to a real organisation", () => {
    for (const s of STREAMS) expect(ORG_IDS.has(s.orgId)).toBe(true);
  });
});
