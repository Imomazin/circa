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
