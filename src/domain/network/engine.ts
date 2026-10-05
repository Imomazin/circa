import { MATERIAL_STREAMS } from "./data";
import { FAMILY_FACTORS } from "./families";
import { distanceBetween } from "./geo";
import {
  MATERIAL_FAMILIES,
  PIPELINE_STAGES,
  type MaterialFamily,
  type MaterialStream,
  type MatchConstraint,
  type OpportunityMatch,
  type PipelineStage,
  type QualityGrade,
} from "./types";
import { BUSINESSES } from "../../db/seed-data";

/** Stable small hash for deterministic (not random) assignment. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1000;
}

const GRADE_RANK: Record<QualityGrade, number> = { A: 3, B: 2, C: 1 };
const OWNERS = ["A. Fraser", "R. Mensah", "K. Lin", "S. Doyle", "J. Okafor", "M. Reid"];

function orgRegion(orgId: string): string {
  return BUSINESSES.find((b) => b.id === orgId)?.region ?? "Glasgow";
}
export function orgName(orgId: string): string {
  return BUSINESSES.find((b) => b.id === orgId)?.name ?? orgId;
}
export function orgSector(orgId: string): string {
  return BUSINESSES.find((b) => b.id === orgId)?.sector ?? "—";
}

function gradeFit(supply: QualityGrade, min: QualityGrade): number {
  const diff = GRADE_RANK[supply] - GRADE_RANK[min];
  if (diff >= 0) return Math.min(1, 0.72 + 0.14 * diff);
  return 0.38;
}

function buildConstraints(
  s: MaterialStream,
  d: MaterialStream,
  distanceKm: number,
  avgReadiness: number,
): MatchConstraint[] {
  const out: MatchConstraint[] = [];
  if (s.grade && d.minGrade && GRADE_RANK[s.grade] < GRADE_RANK[d.minGrade]) {
    out.push({
      label: `Grade ${s.grade} supply needs re-grading to meet ${d.minGrade} specification`,
      severity: "caution",
    });
  }
  if (distanceKm > 220) {
    out.push({ label: `${distanceKm} km haulage — logistics cost to confirm`, severity: "caution" });
  }
  const hi = Math.max(s.annualVolumeTonnes, d.annualVolumeTonnes);
  const lo = Math.min(s.annualVolumeTonnes, d.annualVolumeTonnes);
  if (hi / lo > 1.6) {
    out.push({
      label: `Volume mismatch: ${s.annualVolumeTonnes} t available vs ${d.annualVolumeTonnes} t sought`,
      severity: "info",
    });
  }
  if (avgReadiness < 63) {
    out.push({ label: "Early-stage readiness — joint validation required", severity: "caution" });
  }
  if (out.length === 0) {
    out.push({ label: "Material specification to be confirmed at feasibility", severity: "info" });
  }
  return out;
}

/**
 * Funnel capacity per stage, ordered Identified → Realised. The strongest,
 * most-ready matches are assigned furthest along; the shape reads like an
 * early programme — many identified, one proven loop realised.
 */
const STAGE_CAPACITY: Record<PipelineStage, number> = {
  Identified: 2,
  Matched: 2,
  Validated: 2,
  Engagement: 2,
  Feasibility: 2,
  Pilot: 1,
  "Commercial agreement": 1,
  Implementation: 1,
  Realised: 1,
};

function actionFor(stage: PipelineStage): string {
  switch (stage) {
    case "Identified":
    case "Matched":
      return "Introduce the parties and confirm the material specification.";
    case "Validated":
    case "Engagement":
      return "Scope a pilot batch and agree quality tolerances.";
    case "Feasibility":
    case "Pilot":
      return "Run the pilot and validate unit economics and logistics.";
    case "Commercial agreement":
    case "Implementation":
      return "Finalise offtake terms, volumes and haulage.";
    case "Realised":
      return "Monitor quality and scale volumes across contracts.";
  }
}

let _matches: OpportunityMatch[] | null = null;

/** All opportunity matches, computed once and cached (pure + deterministic). */
export function getMatches(): OpportunityMatch[] {
  if (_matches) return _matches;
  const supplies = MATERIAL_STREAMS.filter((s) => s.direction === "supply");
  const demands = MATERIAL_STREAMS.filter((s) => s.direction === "demand");

  type Draft = Omit<OpportunityMatch, "stage" | "recommendedAction"> & { progress: number };
  const drafts: Draft[] = [];

  for (const s of supplies) {
    for (const d of demands) {
      if (s.family !== d.family) continue;
      if (s.orgId === d.orgId) continue;

      const distanceKm = distanceBetween(orgRegion(s.orgId), orgRegion(d.orgId));
      const avgReadiness = (s.readiness + d.readiness) / 2;
      const volume = Math.min(s.annualVolumeTonnes, d.annualVolumeTonnes);
      const factors = FAMILY_FACTORS[s.family];

      const gFit = gradeFit(s.grade ?? "C", d.minGrade ?? "C");
      const distFit = 1 - Math.min(1, distanceKm / 400);
      const readFit = avgReadiness / 100;
      const volFit =
        Math.min(s.annualVolumeTonnes, d.annualVolumeTonnes) /
        Math.max(s.annualVolumeTonnes, d.annualVolumeTonnes);
      const strength = Math.round(100 * (0.3 * gFit + 0.25 * distFit + 0.3 * readFit + 0.15 * volFit));

      const blendedValue = (s.valuePerTonne + d.valuePerTonne) / 2;
      const id = `${s.id}__${d.id}`;
      // Deterministic progress: strength + readiness, with stable jitter to break ties.
      const progress = 0.48 * (strength / 100) + 0.48 * readFit + 0.04 * (hash(id) / 1000);

      drafts.push({
        id,
        family: s.family,
        material: s.material,
        supplyStreamId: s.id,
        demandStreamId: d.id,
        supplierId: s.orgId,
        buyerId: d.orgId,
        volumeTonnes: volume,
        value: Math.round(volume * blendedValue),
        avoidedDisposal: Math.round(volume * factors.disposalPerTonne),
        distanceKm,
        carbonTonnes: Math.round(volume * factors.carbonPerTonne),
        diversionTonnes: volume,
        strength,
        constraints: buildConstraints(s, d, distanceKm, avgReadiness),
        owner: OWNERS[hash(d.orgId + s.family) % OWNERS.length],
        progress,
      });
    }
  }

  // Assign stages by the funnel: highest-progress matches furthest along.
  const byProgress = [...drafts].sort((a, b) => b.progress - a.progress);
  const stageOrder = [...PIPELINE_STAGES].reverse(); // Realised → Identified
  const stageById = new Map<string, PipelineStage>();
  let cursor = 0;
  for (const stage of stageOrder) {
    for (let i = 0; i < STAGE_CAPACITY[stage] && cursor < byProgress.length; i++, cursor++) {
      stageById.set(byProgress[cursor].id, stage);
    }
  }
  // Any overflow (if capacities < matches) lands in Identified.
  for (; cursor < byProgress.length; cursor++) stageById.set(byProgress[cursor].id, "Identified");

  const out: OpportunityMatch[] = drafts.map(({ progress: _p, ...d }) => {
    const stage = stageById.get(d.id) ?? "Identified";
    return { ...d, stage, recommendedAction: actionFor(stage) };
  });

  out.sort((a, b) => b.value - a.value || b.strength - a.strength);
  _matches = out;
  return out;
}

export function getMatchById(id: string): OpportunityMatch | null {
  return getMatches().find((m) => m.id === id) ?? null;
}

export function getStream(id: string): MaterialStream | null {
  return MATERIAL_STREAMS.find((s) => s.id === id) ?? null;
}

export function matchesForOrg(orgId: string): OpportunityMatch[] {
  return getMatches().filter((m) => m.supplierId === orgId || m.buyerId === orgId);
}

export function relatedMatches(match: OpportunityMatch, limit = 4): OpportunityMatch[] {
  return getMatches()
    .filter((m) => m.id !== match.id && m.family === match.family)
    .slice(0, limit);
}

// ── Aggregates for analytics and the overview ───────────────────────────────

export interface FamilyAggregate {
  family: MaterialFamily;
  color: string;
  supplyTonnes: number;
  demandTonnes: number;
  matchedTonnes: number;
  matchCount: number;
  value: number;
  carbonTonnes: number;
  topMatchStrength: number;
}

export function familyAggregates(): FamilyAggregate[] {
  const matches = getMatches();
  return MATERIAL_FAMILIES.map((family) => {
    const fMatches = matches.filter((m) => m.family === family);
    const streams = MATERIAL_STREAMS.filter((s) => s.family === family);
    const supplyTonnes = streams
      .filter((s) => s.direction === "supply")
      .reduce((n, s) => n + s.annualVolumeTonnes, 0);
    const demandTonnes = streams
      .filter((s) => s.direction === "demand")
      .reduce((n, s) => n + s.annualVolumeTonnes, 0);
    return {
      family,
      color: FAMILY_FACTORS[family].color,
      supplyTonnes,
      demandTonnes,
      matchedTonnes: fMatches.reduce((n, m) => n + m.volumeTonnes, 0),
      matchCount: fMatches.length,
      value: fMatches.reduce((n, m) => n + m.value, 0),
      carbonTonnes: fMatches.reduce((n, m) => n + m.carbonTonnes, 0),
      topMatchStrength: fMatches.reduce((n, m) => Math.max(n, m.strength), 0),
    };
  }).filter((f) => f.supplyTonnes > 0 || f.demandTonnes > 0);
}

export interface NetworkTotals {
  matchCount: number;
  totalValue: number;
  avoidedDisposal: number;
  carbonTonnes: number;
  diversionTonnes: number;
  organisations: number;
  materialsTracked: number;
  readyToProgress: number;
}

const ADVANCED: PipelineStage[] = ["Pilot", "Commercial agreement", "Implementation", "Realised"];

export function networkTotals(): NetworkTotals {
  const matches = getMatches();
  const orgs = new Set<string>();
  matches.forEach((m) => {
    orgs.add(m.supplierId);
    orgs.add(m.buyerId);
  });
  return {
    matchCount: matches.length,
    totalValue: matches.reduce((n, m) => n + m.value, 0),
    avoidedDisposal: matches.reduce((n, m) => n + m.avoidedDisposal, 0),
    carbonTonnes: matches.reduce((n, m) => n + m.carbonTonnes, 0),
    diversionTonnes: matches.reduce((n, m) => n + m.diversionTonnes, 0),
    organisations: orgs.size,
    materialsTracked: familyAggregates().length,
    readyToProgress: matches.filter((m) => ADVANCED.includes(m.stage)).length,
  };
}

export function pipelineCounts(): { stage: PipelineStage; count: number; value: number }[] {
  const matches = getMatches();
  return PIPELINE_STAGES.map((stage) => {
    const s = matches.filter((m) => m.stage === stage);
    return { stage, count: s.length, value: s.reduce((n, m) => n + m.value, 0) };
  });
}

export function topOpportunities(limit = 6): OpportunityMatch[] {
  return [...getMatches()].sort((a, b) => b.value - a.value).slice(0, limit);
}

/** Supply with no internal demand match — a surfaced market gap. */
export function unmatchedSupply(): MaterialStream[] {
  const matched = new Set(getMatches().map((m) => m.supplyStreamId));
  return MATERIAL_STREAMS.filter((s) => s.direction === "supply" && !matched.has(s.id));
}
