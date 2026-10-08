import "server-only";
import {
  getMatches,
  getMatchById,
  getStream,
  matchesForOrg,
  relatedMatches,
  familyAggregates,
  networkTotals,
  pipelineCounts,
  topOpportunities,
  unmatchedSupply,
  orgName,
  orgSector,
  type FamilyAggregate,
  type NetworkTotals,
} from "@/domain/network/engine";
import { MATERIAL_STREAMS } from "@/domain/network/data";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { BUSINESSES } from "@/db/seed-data";
import { computeScores } from "@/domain/scoring";
import type { MaterialFamily, MaterialStream, OpportunityMatch, PipelineStage } from "@/domain/network/types";
import type { MatchView, StreamView } from "@/lib/view-types";

/**
 * Server-side access to the circular network. The network is derived
 * deterministically from the organisation dataset, so it works identically
 * with or without a database connection. Matches are enriched with
 * organisation names/regions here so client components never import the
 * engine (and never bundle the seed dataset).
 */

export type { MatchView, StreamView } from "@/lib/view-types";

function region(orgId: string): string {
  return BUSINESSES.find((b) => b.id === orgId)?.region ?? "—";
}

export function enrich(m: OpportunityMatch): MatchView {
  return {
    ...m,
    supplierName: orgName(m.supplierId),
    supplierRegion: region(m.supplierId),
    supplierSector: orgSector(m.supplierId),
    buyerName: orgName(m.buyerId),
    buyerRegion: region(m.buyerId),
    buyerSector: orgSector(m.buyerId),
  };
}

export function getOpportunities(): MatchView[] {
  return getMatches().map(enrich);
}

export interface NetworkOverview {
  totals: NetworkTotals;
  families: FamilyAggregate[];
  pipeline: { stage: PipelineStage; count: number; value: number }[];
  top: MatchView[];
}

export function getNetworkOverview(): NetworkOverview {
  return {
    totals: networkTotals(),
    families: familyAggregates(),
    pipeline: pipelineCounts(),
    top: topOpportunities(6).map(enrich),
  };
}

function enrichStream(s: MaterialStream): StreamView {
  return {
    ...s,
    orgName: orgName(s.orgId),
    orgRegion: region(s.orgId),
    orgSector: orgSector(s.orgId),
  };
}

export interface OpportunityDetail {
  match: MatchView;
  supply: StreamView;
  demand: StreamView;
  familyNote: string;
  related: MatchView[];
}

export function getOpportunity(id: string): OpportunityDetail | null {
  const match = getMatchById(id);
  if (!match) return null;
  const supply = getStream(match.supplyStreamId);
  const demand = getStream(match.demandStreamId);
  if (!supply || !demand) return null;
  return {
    match: enrich(match),
    supply: enrichStream(supply),
    demand: enrichStream(demand),
    familyNote: FAMILY_FACTORS[match.family].note,
    related: relatedMatches(match).map(enrich),
  };
}

export interface MaterialFamilyView extends FamilyAggregate {
  note: string;
  disposalPerTonne: number;
  carbonPerTonne: number;
  suppliers: StreamView[];
  buyers: StreamView[];
  matches: MatchView[];
}

export function getMaterials(): { families: MaterialFamilyView[]; unmatched: StreamView[] } {
  const aggs = familyAggregates();
  const matches = getMatches();
  const families = aggs.map((agg) => {
    const factors = FAMILY_FACTORS[agg.family];
    const streams = MATERIAL_STREAMS.filter((s) => s.family === agg.family).map(enrichStream);
    return {
      ...agg,
      note: factors.note,
      disposalPerTonne: factors.disposalPerTonne,
      carbonPerTonne: factors.carbonPerTonne,
      suppliers: streams.filter((s) => s.direction === "supply"),
      buyers: streams.filter((s) => s.direction === "demand"),
      matches: matches.filter((m) => m.family === agg.family).map(enrich),
    } satisfies MaterialFamilyView;
  });
  return { families, unmatched: unmatchedSupply().map(enrichStream) };
}

export function getMaterialFamily(family: MaterialFamily): MaterialFamilyView | null {
  return getMaterials().families.find((f) => f.family === family) ?? null;
}

export interface OrgNetwork {
  supply: StreamView[];
  demand: StreamView[];
  matches: MatchView[];
  asSupplier: number;
  asBuyer: number;
  networkValue: number;
}

export function getOrgNetwork(orgId: string): OrgNetwork {
  const streams = MATERIAL_STREAMS.filter((s) => s.orgId === orgId).map(enrichStream);
  const matches = matchesForOrg(orgId).map(enrich);
  return {
    supply: streams.filter((s) => s.direction === "supply"),
    demand: streams.filter((s) => s.direction === "demand"),
    matches,
    asSupplier: matches.filter((m) => m.supplierId === orgId).length,
    asBuyer: matches.filter((m) => m.buyerId === orgId).length,
    networkValue: matches.reduce((n, m) => n + m.value, 0),
  };
}

export interface SectorIntel {
  sector: string;
  orgCount: number;
  orgIds: string[];
  opportunityValue: number;
  carbonTonnes: number;
  matchCount: number;
  readyToProgress: number;
  avgViability: number;
  avgOpportunity: number;
  avgReadiness: number;
  /** 0–100 composite board-level attractiveness. */
  attractiveness: number;
  topFamily: string;
  families: string[];
  barriers: string[];
}

const ADVANCED_STAGES = ["Pilot", "Commercial agreement", "Implementation", "Realised"];
const SEED_ISO = "2026-09-01T09:00:00.000Z";

/** Board-level intelligence per sector, combining scores and network value. */
export function getSectorIntelligence(): SectorIntel[] {
  const matches = getMatches();
  const sectors = [...new Set(BUSINESSES.map((b) => b.sector))];

  return sectors
    .map((sector) => {
      const orgs = BUSINESSES.filter((b) => b.sector === sector);
      const orgIds = orgs.map((o) => o.id);
      const bundles = orgs.map((o) => computeScores(o.inputs, SEED_ISO));
      const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);
      const avgViability = avg(bundles.map((b) => b.viability.score));
      const avgOpportunity = avg(bundles.map((b) => b.opportunity.score));

      const sectorMatches = matches.filter(
        (m) => orgIds.includes(m.supplierId) || orgIds.includes(m.buyerId),
      );
      const originated = matches.filter((m) => orgIds.includes(m.supplierId));
      const opportunityValue = originated.reduce((n, m) => n + m.value, 0);
      const carbonTonnes = originated.reduce((n, m) => n + m.carbonTonnes, 0);
      const avgReadiness = avg(sectorMatches.map((m) => m.strength));

      const famCount = new Map<string, number>();
      for (const s of MATERIAL_STREAMS.filter((s) => orgIds.includes(s.orgId)))
        famCount.set(s.family, (famCount.get(s.family) ?? 0) + 1);
      const families = [...famCount.keys()];
      const topFamily = [...famCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

      const barrierCount = new Map<string, number>();
      for (const b of bundles)
        for (const d of b.viability.negativeDrivers) {
          const k = d.replace(/\s*\(\d+\)$/, "").replace(/\s*\(inverted\)/, "");
          barrierCount.set(k, (barrierCount.get(k) ?? 0) + 1);
        }
      const barriers = [...barrierCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k);

      // Composite attractiveness: viability, opportunity score, network readiness, value scale.
      const valueScore = Math.min(100, (opportunityValue / 200_000) * 100);
      const attractiveness = Math.round(
        0.3 * avgViability + 0.25 * avgOpportunity + 0.25 * avgReadiness + 0.2 * valueScore,
      );

      return {
        sector,
        orgCount: orgs.length,
        orgIds,
        opportunityValue,
        carbonTonnes,
        matchCount: sectorMatches.length,
        readyToProgress: sectorMatches.filter((m) => ADVANCED_STAGES.includes(m.stage)).length,
        avgViability: Math.round(avgViability * 10) / 10,
        avgOpportunity: Math.round(avgOpportunity * 10) / 10,
        avgReadiness: Math.round(avgReadiness),
        attractiveness,
        topFamily,
        families,
        barriers,
      } satisfies SectorIntel;
    })
    .sort((a, b) => b.attractiveness - a.attractiveness);
}
