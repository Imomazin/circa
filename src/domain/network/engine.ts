import { FAMILY_FACTORS } from "./families";
import { distanceBetween } from "./geo";
import {
  MATERIAL_FAMILIES,
  PIPELINE_STAGES,
  type EconomicLine,
  type MaterialFamily,
  type MaterialStream,
  type MatchConstraint,
  type OpportunityMatch,
  type PipelineStage,
  type QualityGrade,
} from "./types";
import { enterpriseStreams, orgById, MATERIAL_CLASS_BY_ID } from "../enterprise/generate";
import { hashStr } from "../enterprise/prng";

/**
 * Opportunity engine.
 *
 * Consumes the enterprise network's material streams — themselves sourced from
 * the ERP and procurement connectors — and pairs compatible supply and demand
 * into opportunities with a full economic model: gross material value, avoided
 * disposal (SEPA benchmark), distance-driven transport cost and carbon
 * (logistics + Climatiq), reprocessing and implementation cost, net value and
 * a margin band. Every figure carries the connector/dataset it came from.
 *
 * Pure and deterministic; cached on first use.
 */

const GRADE_RANK: Record<QualityGrade, number> = { A: 3, B: 2, C: 1 };
const OWNERS = ["A. Fraser", "R. Mensah", "K. Lin", "S. Doyle", "J. Okafor", "M. Reid"];

/** HGV freight: £ per tonne-km and tCO2e per tonne-km (indicative). */
const FREIGHT_COST_PER_TKM = 0.11;
const FREIGHT_CO2E_PER_TKM = 0.00011;

export function orgName(orgId: string): string {
  return orgById(orgId)?.name ?? orgId;
}
export function orgSector(orgId: string): string {
  return orgById(orgId)?.sector ?? "—";
}
export function orgRegion(orgId: string): string {
  return orgById(orgId)?.region ?? "Glasgow";
}

function gradeFit(supply: QualityGrade, min: QualityGrade): number {
  const diff = GRADE_RANK[supply] - GRADE_RANK[min];
  if (diff >= 0) return Math.min(1, 0.72 + 0.14 * diff);
  return 0.38;
}

function confidence(readiness: number, grade?: QualityGrade): number {
  const g = grade ? (GRADE_RANK[grade] - 1) * 8 : 0;
  return Math.max(30, Math.min(97, Math.round(readiness + g)));
}

function disposalPerTonne(s: MaterialStream): number {
  return s.classId ? (MATERIAL_CLASS_BY_ID.get(s.classId)?.disposalPerTonne ?? 110) : FAMILY_FACTORS[s.family].disposalPerTonne;
}
function carbonPerTonne(s: MaterialStream): number {
  return s.classId ? (MATERIAL_CLASS_BY_ID.get(s.classId)?.carbonPerTonne ?? 1) : FAMILY_FACTORS[s.family].carbonPerTonne;
}
function processingPerTonne(s: MaterialStream): number {
  return s.classId ? (MATERIAL_CLASS_BY_ID.get(s.classId)?.processingPerTonne ?? 120) : 120;
}

function buildConstraints(
  s: MaterialStream,
  d: MaterialStream,
  distanceKm: number,
  avgReadiness: number,
  netValue: number,
): MatchConstraint[] {
  const out: MatchConstraint[] = [];
  if (s.grade && d.minGrade && GRADE_RANK[s.grade] < GRADE_RANK[d.minGrade]) {
    out.push({ label: `Grade ${s.grade} supply needs re-grading to meet ${d.minGrade} specification`, severity: "caution" });
  }
  if (distanceKm > 240) out.push({ label: `${distanceKm} km haulage — freight cost and emissions to confirm`, severity: "caution" });
  const hi = Math.max(s.annualVolumeTonnes, d.annualVolumeTonnes);
  const lo = Math.min(s.annualVolumeTonnes, d.annualVolumeTonnes);
  if (hi / lo > 1.8) out.push({ label: `Volume mismatch: ${s.annualVolumeTonnes} t available vs ${d.annualVolumeTonnes} t sought`, severity: "info" });
  if (avgReadiness < 60) out.push({ label: "Early-stage readiness — joint validation required", severity: "caution" });
  if (netValue < 25_000) out.push({ label: "Thin net margin — logistics or processing dominate", severity: "caution" });
  if (out.length === 0) out.push({ label: "Material specification to be confirmed at feasibility", severity: "info" });
  return out;
}

function actionFor(stage: PipelineStage): string {
  switch (stage) {
    case "Identified":
    case "Matched":
      return "Verify both parties in Companies House and confirm the material specification.";
    case "Validated":
    case "Engagement":
      return "Open a CRM engagement and scope a pilot batch with agreed tolerances.";
    case "Feasibility":
    case "Pilot":
      return "Run the pilot, validate unit economics and confirm freight routing.";
    case "Commercial agreement":
    case "Implementation":
      return "Prepare a procurement sourcing event and finalise offtake terms.";
    case "Realised":
      return "Track delivered volume and scale across contracts.";
  }
}

const STAGE_WEIGHTS: Record<PipelineStage, number> = {
  Identified: 0.2,
  Matched: 0.16,
  Validated: 0.13,
  Engagement: 0.11,
  Feasibility: 0.1,
  Pilot: 0.09,
  "Commercial agreement": 0.08,
  Implementation: 0.07,
  Realised: 0.06,
};

const MAX_OPPORTUNITIES = 180;
const SUPPLIERS_PER_DEMAND = 2;

let _matches: OpportunityMatch[] | null = null;
let _streamMap: Map<string, MaterialStream> | null = null;

export function getStream(id: string): MaterialStream | null {
  if (!_streamMap) _streamMap = new Map(enterpriseStreams().map((s) => [s.id, s]));
  return _streamMap.get(id) ?? null;
}

export function getMatches(): OpportunityMatch[] {
  if (_matches) return _matches;
  const streams = enterpriseStreams();
  const supplyByFamily = new Map<MaterialFamily, MaterialStream[]>();
  for (const s of streams) {
    if (s.direction !== "supply") continue;
    const arr = supplyByFamily.get(s.family) ?? [];
    arr.push(s);
    supplyByFamily.set(s.family, arr);
  }

  type Draft = OpportunityMatch & { progress: number };
  const drafts: Draft[] = [];

  for (const d of streams) {
    if (d.direction !== "demand") continue;
    const candidates = (supplyByFamily.get(d.family) ?? []).filter((s) => s.orgId !== d.orgId);

    const scored = candidates
      .map((s) => {
        const distanceKm = distanceBetween(orgRegion(s.orgId), orgRegion(d.orgId));
        const avgReadiness = (s.readiness + d.readiness) / 2;
        const gFit = gradeFit(s.grade ?? "C", d.minGrade ?? "C");
        const distFit = 1 - Math.min(1, distanceKm / 400);
        const readFit = avgReadiness / 100;
        const volFit = Math.min(s.annualVolumeTonnes, d.annualVolumeTonnes) / Math.max(s.annualVolumeTonnes, d.annualVolumeTonnes);
        const strength = Math.round(100 * (0.3 * gFit + 0.25 * distFit + 0.3 * readFit + 0.15 * volFit));
        return { s, distanceKm, avgReadiness, strength };
      })
      .sort((a, b) => b.strength - a.strength)
      .slice(0, SUPPLIERS_PER_DEMAND);

    for (const c of scored) {
      const s = c.s;
      const volume = Math.min(s.annualVolumeTonnes, d.annualVolumeTonnes);
      const blended = (s.valuePerTonne + d.valuePerTonne) / 2;

      const grossMaterialValue = Math.round(volume * blended);
      const avoidedDisposal = Math.round(volume * disposalPerTonne(s));
      const transportCost = Math.round(c.distanceKm * volume * FREIGHT_COST_PER_TKM);
      const processingCost = Math.round(volume * processingPerTonne(s));
      const implementationCost = Math.round(15_000 + volume * 55 + c.distanceKm * 40);
      const netValue = grossMaterialValue + avoidedDisposal - transportCost - processingCost;
      if (netValue <= 0) continue;

      const grossCarbon = volume * carbonPerTonne(s);
      const transportCarbon = c.distanceKm * volume * FREIGHT_CO2E_PER_TKM;
      const carbonTonnes = Math.max(0, Math.round(grossCarbon - transportCarbon));

      const marginPct = (netValue / grossMaterialValue) * 100;
      const id = `${s.id}__${d.id}`;
      const supplyConf = confidence(s.readiness, s.grade);
      const demandConf = confidence(d.readiness, d.minGrade);
      const progress = 0.5 * (c.strength / 100) + 0.5 * (c.avgReadiness / 100) + 0.02 * (hashStr(id) / 4294967296);

      const economics: EconomicLine[] = [
        { label: "Gross material value", value: grossMaterialValue, source: s.sourceConnector ?? "sap-s4hana", assumption: `${volume} t × £${Math.round(blended)}/t blended` },
        { label: "Avoided disposal", value: avoidedDisposal, source: "sepa", assumption: `£${disposalPerTonne(s)}/t SEPA benchmark` },
        { label: "Transport cost", value: -transportCost, source: "openrouteservice", assumption: `${c.distanceKm} km × £${FREIGHT_COST_PER_TKM}/t·km` },
        { label: "Processing cost", value: -processingCost, source: "circa-model", assumption: `£${processingPerTonne(s)}/t reconditioning` },
        { label: "Net annual value", value: netValue, source: "circa-model" },
        { label: "Implementation (one-off)", value: -implementationCost, source: "circa-model", assumption: "mobilisation, set-up, logistics" },
      ];

      drafts.push({
        id,
        family: s.family,
        material: s.material,
        supplyStreamId: s.id,
        demandStreamId: d.id,
        supplierId: s.orgId,
        buyerId: d.orgId,
        volumeTonnes: volume,
        value: netValue,
        avoidedDisposal,
        distanceKm: c.distanceKm,
        carbonTonnes,
        diversionTonnes: volume,
        strength: c.strength,
        stage: "Identified",
        constraints: buildConstraints(s, d, c.distanceKm, c.avgReadiness, netValue),
        recommendedAction: "",
        owner: OWNERS[hashStr(d.orgId + s.family) % OWNERS.length],
        grossMaterialValue,
        transportCost,
        processingCost,
        implementationCost,
        netValue,
        marginLowPct: Math.max(0, Math.round(marginPct - 8)),
        marginHighPct: Math.min(100, Math.round(marginPct + 6)),
        supplyConfidence: supplyConf,
        demandConfidence: demandConf,
        transportCarbon: Math.round(transportCarbon),
        economics,
        progress,
      });
    }
  }

  // Keep the strongest opportunities, then assign a believable funnel.
  drafts.sort((a, b) => b.netValue - a.netValue);
  const kept = drafts.slice(0, MAX_OPPORTUNITIES);

  const byProgress = [...kept].sort((a, b) => a.progress - b.progress); // low → high
  const stageById = new Map<string, PipelineStage>();
  let idx = 0;
  const n = byProgress.length;
  for (const stage of PIPELINE_STAGES) {
    const count = Math.round(STAGE_WEIGHTS[stage] * n);
    for (let i = 0; i < count && idx < n; i++, idx++) stageById.set(byProgress[idx].id, stage);
  }
  for (; idx < n; idx++) stageById.set(byProgress[idx].id, "Realised");

  const out: OpportunityMatch[] = kept.map(({ progress: _p, ...m }) => {
    const stage = stageById.get(m.id) ?? "Identified";
    return { ...m, stage, recommendedAction: actionFor(stage) };
  });
  out.sort((a, b) => b.netValue - a.netValue || b.strength - a.strength);
  _matches = out;
  return out;
}

export function getMatchById(id: string): OpportunityMatch | null {
  return getMatches().find((m) => m.id === id) ?? null;
}
export function matchesForOrg(orgId: string): OpportunityMatch[] {
  return getMatches().filter((m) => m.supplierId === orgId || m.buyerId === orgId);
}
export function relatedMatches(match: OpportunityMatch, limit = 4): OpportunityMatch[] {
  return getMatches()
    .filter((m) => m.id !== match.id && m.family === match.family)
    .sort((a, b) => b.netValue - a.netValue)
    .slice(0, limit);
}

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
  const streams = enterpriseStreams();
  return MATERIAL_FAMILIES.map((family) => {
    const fMatches = matches.filter((m) => m.family === family);
    const fStreams = streams.filter((s) => s.family === family);
    return {
      family,
      color: FAMILY_FACTORS[family].color,
      supplyTonnes: fStreams.filter((s) => s.direction === "supply").reduce((n, s) => n + s.annualVolumeTonnes, 0),
      demandTonnes: fStreams.filter((s) => s.direction === "demand").reduce((n, s) => n + s.annualVolumeTonnes, 0),
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
  return [...getMatches()].sort((a, b) => b.netValue - a.netValue).slice(0, limit);
}

export function unmatchedSupply(): MaterialStream[] {
  const matched = new Set(getMatches().map((m) => m.supplyStreamId));
  return enterpriseStreams().filter((s) => s.direction === "supply" && !matched.has(s.id));
}
