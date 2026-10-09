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
import { FAMILY_FACTORS } from "@/domain/network/families";
import { BUSINESSES } from "@/db/seed-data";
import { computeScores } from "@/domain/scoring";
import { enterpriseOrgs, enterpriseStreams, orgById } from "@/domain/enterprise/generate";
import type { EnterpriseOrg } from "@/domain/enterprise/types";
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
  return orgById(orgId)?.region ?? "—";
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
  supplierCount: number;
  buyerCount: number;
  matches: MatchView[];
}

export function getMaterials(): { families: MaterialFamilyView[]; unmatched: StreamView[] } {
  const aggs = familyAggregates();
  const matches = getMatches();
  const allStreams = enterpriseStreams();
  const families = aggs.map((agg) => {
    const factors = FAMILY_FACTORS[agg.family];
    const streams = allStreams.filter((s) => s.family === agg.family).map(enrichStream);
    const suppliers = streams.filter((s) => s.direction === "supply").sort((a, b) => b.annualVolumeTonnes - a.annualVolumeTonnes);
    const buyers = streams.filter((s) => s.direction === "demand").sort((a, b) => b.annualVolumeTonnes - a.annualVolumeTonnes);
    return {
      ...agg,
      note: factors.note,
      disposalPerTonne: factors.disposalPerTonne,
      carbonPerTonne: factors.carbonPerTonne,
      suppliers: suppliers.slice(0, 6),
      buyers: buyers.slice(0, 6),
      supplierCount: suppliers.length,
      buyerCount: buyers.length,
      matches: matches.filter((m) => m.family === agg.family).sort((a, b) => b.value - a.value).slice(0, 5).map(enrich),
    } satisfies MaterialFamilyView;
  });
  return { families, unmatched: unmatchedSupply().slice(0, 10).map(enrichStream) };
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
  const streams = enterpriseStreams().filter((s) => s.orgId === orgId).map(enrichStream);
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

const GENERIC_BARRIERS = ["Evidence coverage", "Commercial traction", "Supplier concentration"];

/** Board-level intelligence per sector, across the full enterprise network. */
export function getSectorIntelligence(): SectorIntel[] {
  const matches = getMatches();
  const orgs = enterpriseOrgs();
  const streams = enterpriseStreams();
  const sectors = [...new Set(orgs.map((o) => o.sector))];
  const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);

  return sectors
    .map((sector) => {
      const sectorOrgs = orgs.filter((o) => o.sector === sector);
      const orgIds = new Set(sectorOrgs.map((o) => o.id));
      const featured = BUSINESSES.filter((b) => b.sector === sector);
      const bundles = featured.map((o) => computeScores(o.inputs, SEED_ISO));

      const sectorMatches = matches.filter((m) => orgIds.has(m.supplierId) || orgIds.has(m.buyerId));
      const originated = matches.filter((m) => orgIds.has(m.supplierId));
      const opportunityValue = originated.reduce((n, m) => n + m.value, 0);
      const carbonTonnes = originated.reduce((n, m) => n + m.carbonTonnes, 0);
      const avgReadiness = avg(sectorMatches.map((m) => m.strength));

      // Viability/opportunity from assessed orgs where present; else a readiness proxy.
      const avgViability = bundles.length ? avg(bundles.map((b) => b.viability.score)) : Math.max(40, avgReadiness - 4);
      const avgOpportunity = bundles.length ? avg(bundles.map((b) => b.opportunity.score)) : Math.max(42, avgReadiness);

      const famCount = new Map<string, number>();
      for (const s of streams) if (orgIds.has(s.orgId)) famCount.set(s.family, (famCount.get(s.family) ?? 0) + 1);
      const families = [...famCount.keys()];
      const topFamily = [...famCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

      let barriers = GENERIC_BARRIERS;
      if (bundles.length) {
        const barrierCount = new Map<string, number>();
        for (const b of bundles)
          for (const d of b.viability.negativeDrivers) {
            const k = d.replace(/\s*\(\d+\)$/, "").replace(/\s*\(inverted\)/, "");
            barrierCount.set(k, (barrierCount.get(k) ?? 0) + 1);
          }
        const derived = [...barrierCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
        if (derived.length) barriers = derived;
      }

      const valueScore = Math.min(100, (opportunityValue / 900_000) * 100);
      const attractiveness = Math.round(
        0.3 * avgViability + 0.25 * avgOpportunity + 0.25 * avgReadiness + 0.2 * valueScore,
      );

      return {
        sector,
        orgCount: sectorOrgs.length,
        orgIds: [...orgIds],
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

// ── Organisation roster + Organisation 360 ──────────────────────────────────

export interface OrgRosterRow {
  id: string;
  name: string;
  sector: string;
  region: string;
  size: string;
  featured: boolean;
  verified: boolean;
  opportunities: number;
  networkValue: number;
  supplyTonnes: number;
  demandTonnes: number;
}

export function getOrgRoster(): OrgRosterRow[] {
  const streams = enterpriseStreams();
  const matches = getMatches();
  const valueByOrg = new Map<string, { n: number; v: number }>();
  for (const m of matches) {
    for (const id of [m.supplierId, m.buyerId]) {
      const cur = valueByOrg.get(id) ?? { n: 0, v: 0 };
      cur.n += 1;
      cur.v += m.value;
      valueByOrg.set(id, cur);
    }
  }
  const tonnesByOrg = new Map<string, { s: number; d: number }>();
  for (const s of streams) {
    const cur = tonnesByOrg.get(s.orgId) ?? { s: 0, d: 0 };
    if (s.direction === "supply") cur.s += s.annualVolumeTonnes;
    else cur.d += s.annualVolumeTonnes;
    tonnesByOrg.set(s.orgId, cur);
  }
  return enterpriseOrgs()
    .map((o) => {
      const v = valueByOrg.get(o.id) ?? { n: 0, v: 0 };
      const t = tonnesByOrg.get(o.id) ?? { s: 0, d: 0 };
      return {
        id: o.id,
        name: o.name,
        sector: o.sector,
        region: o.region,
        size: o.size,
        featured: o.featured,
        verified: o.verified,
        opportunities: v.n,
        networkValue: v.v,
        supplyTonnes: t.s,
        demandTonnes: t.d,
      } satisfies OrgRosterRow;
    })
    .sort((a, b) => b.networkValue - a.networkValue || a.name.localeCompare(b.name));
}

export interface OrgProfile {
  org: EnterpriseOrg;
  network: OrgNetwork;
}

export function getOrgProfile(id: string): OrgProfile | null {
  const org = orgById(id);
  if (!org) return null;
  return { org, network: getOrgNetwork(id) };
}
