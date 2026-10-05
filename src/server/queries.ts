import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import {
  organisations,
  assessments,
  scores,
  financialScenarios,
  evidenceItems,
  recommendations,
  resourceDependencies,
  supplierRisks,
  sectorBenchmarks,
  programmeInsights,
  auditEvents,
  type Organisation,
  type Assessment,
  type ScoreRow,
} from "@/db/schema";
import { BUSINESSES, PROGRAMME_INSIGHTS } from "@/db/seed-data";
import { deriveScenarios, SEED_DATE } from "@/db/seed-core";
import { computeScores, headlineScore, type ScoreBundle } from "@/domain/scoring";
import { generateRecommendations } from "@/domain/recommendations/engine";
import {
  computeScenarioSet,
  baselineEbitda,
  type ScenarioAssumptions,
  type ScenarioSet,
} from "@/domain/scenarios/model";
import { runSensitivity, type SensitivityRow } from "@/domain/scenarios/sensitivity";
import {
  bandForScore,
  confidenceForScore,
  SCENARIO_LABELS,
  type ScenarioType,
} from "@/domain/constants";
import type { DashboardRow } from "@/lib/view-types";

/**
 * Server-side data access. When DATABASE_URL is absent, the demonstrator uses
 * the exact deterministic synthetic dataset that is normally seeded into Neon.
 */

export interface BusinessSummary {
  org: Organisation;
  assessment: Assessment;
  score: ScoreRow;
  bundle: ScoreBundle;
}

function bundleFor(a: Assessment, s: ScoreRow): ScoreBundle {
  return computeScores(a.inputs, s.calculatedAt.toISOString());
}

function monthsBefore(months: number): Date {
  const d = new Date(SEED_DATE);
  d.setMonth(d.getMonth() - months);
  return d;
}

function demoSummary(id: string): BusinessSummary | null {
  const spec = BUSINESSES.find((b) => b.id === id);
  if (!spec) return null;
  const bundle = computeScores(spec.inputs, SEED_DATE.toISOString());
  const org: Organisation = {
    id: spec.id,
    name: spec.name,
    sector: spec.sector,
    companySize: spec.companySize,
    region: spec.region,
    description: spec.description,
    currentOperatingModel: spec.currentOperatingModel,
    currentRevenueModel: spec.currentRevenueModel,
    productsServices: spec.productsServices,
    customerModel: spec.customerModel,
    commercialPressures: spec.commercialPressures,
    createdAt: SEED_DATE,
  };
  const assessment: Assessment = {
    id: spec.id,
    organisationId: spec.id,
    title: `${spec.name} — circular opportunity assessment`,
    stage: spec.stage,
    circularModels: spec.circularModels,
    opportunitySummary: spec.opportunitySummary,
    commercialRationale: spec.commercialRationale,
    inputs: spec.inputs,
    baseline: spec.baseline,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  };
  const score: ScoreRow = {
    id: `score-${spec.id}`,
    assessmentId: spec.id,
    headline: headlineScore(bundle),
    viability: bundle.viability.score,
    resilience: bundle.resilience.score,
    investor: bundle.investor.score,
    opportunity: bundle.opportunity.score,
    evidence: bundle.evidence.score,
    bundle: null,
    calculatedAt: SEED_DATE,
  };
  return { org, assessment, score, bundle };
}

function demoSummaries(): BusinessSummary[] {
  return BUSINESSES.map((b) => demoSummary(b.id)!).sort((a, b) => b.score.headline - a.score.headline);
}

export async function getAllBusinessSummaries(): Promise<BusinessSummary[]> {
  if (!process.env.DATABASE_URL) return demoSummaries();
  const [orgs, allAssessments, allScores] = await Promise.all([
    db.select().from(organisations),
    db.select().from(assessments),
    db.select().from(scores),
  ]);
  const assessmentByOrg = new Map(allAssessments.map((a) => [a.organisationId, a]));
  const scoreByAssessment = new Map(allScores.map((s) => [s.assessmentId, s]));

  const out: BusinessSummary[] = [];
  for (const org of orgs) {
    const a = assessmentByOrg.get(org.id);
    if (!a) continue;
    const s = scoreByAssessment.get(a.id);
    if (!s) continue;
    out.push({ org, assessment: a, score: s, bundle: bundleFor(a, s) });
  }
  out.sort((x, y) => y.score.headline - x.score.headline);
  return out;
}

export function summaryToRow({ org, assessment, score, bundle }: BusinessSummary): DashboardRow {
  return {
    id: org.id,
    name: org.name,
    sector: org.sector,
    companySize: org.companySize,
    region: org.region,
    stage: assessment.stage,
    circularModels: assessment.circularModels,
    headline: score.headline,
    viability: score.viability,
    viabilityBand: bandForScore(score.viability),
    resilience: score.resilience,
    investor: score.investor,
    investorBand: bandForScore(score.investor),
    opportunity: score.opportunity,
    evidence: score.evidence,
    confidence: confidenceForScore(score.evidence),
    capex: assessment.inputs.capexRequirement,
    projectedOpportunity: assessment.inputs.annualRevenueUplift + assessment.inputs.annualCostSaving,
    viabilityBarriers: bundle.viability.negativeDrivers,
    investorBarriers: bundle.investor.negativeDrivers,
  };
}

export interface BusinessDetail extends BusinessSummary {
  scenarios: { type: ScenarioType; label: string; assumptions: ScenarioAssumptions }[];
  scenarioSet: ScenarioSet;
  baselineEbitda: number;
  evidence: (typeof evidenceItems.$inferSelect)[];
  recommendations: (typeof recommendations.$inferSelect)[];
  resourceDependencies: (typeof resourceDependencies.$inferSelect)[];
  supplierRisks: (typeof supplierRisks.$inferSelect)[];
}

function demoBusinessDetail(id: string): BusinessDetail | null {
  const spec = BUSINESSES.find((b) => b.id === id);
  const summary = demoSummary(id);
  if (!spec || !summary) return null;
  const scenarioMap = deriveScenarios(spec);
  const scenarioRows = (Object.keys(scenarioMap) as ScenarioType[]).map((type) => ({
    type,
    label: SCENARIO_LABELS[type],
    assumptions: scenarioMap[type],
  }));
  return {
    ...summary,
    scenarios: scenarioRows.sort((a, b) => scenarioOrder(a.type) - scenarioOrder(b.type)),
    scenarioSet: computeScenarioSet(spec.baseline, scenarioMap),
    baselineEbitda: baselineEbitda(spec.baseline),
    evidence: spec.evidence
      .map((ev, i) => ({
        id: `evidence-${spec.id}-${i}`,
        assessmentId: spec.id,
        type: ev.type,
        description: ev.description,
        source: ev.source,
        confidence: ev.confidence,
        linkedArea: ev.linkedArea,
        status: ev.status,
        dateRecorded: monthsBefore(ev.agedMonths),
      }))
      .sort((a, b) => b.dateRecorded.getTime() - a.dateRecorded.getTime()),
    recommendations: generateRecommendations(spec.inputs, summary.bundle).map((r, i) => ({
      id: `recommendation-${spec.id}-${i}`,
      assessmentId: spec.id,
      code: r.code,
      title: r.title,
      rationale: r.rationale,
      priority: r.priority,
      category: r.category,
    })),
    resourceDependencies: spec.resourceDeps.map((r, i) => ({
      id: `resource-${spec.id}-${i}`,
      organisationId: spec.id,
      material: r.material,
      criticality: r.criticality,
      annualSpend: r.annualSpend,
      volatility: r.volatility,
      notes: r.notes,
    })),
    supplierRisks: spec.supplierRisks.map((r, i) => ({
      id: `supplier-${spec.id}-${i}`,
      organisationId: spec.id,
      supplier: r.supplier,
      category: r.category,
      shareOfSupplyPct: r.shareOfSupplyPct,
      region: r.region,
      riskLevel: r.riskLevel,
    })),
  };
}

export async function getBusinessDetail(id: string): Promise<BusinessDetail | null> {
  if (!process.env.DATABASE_URL) return demoBusinessDetail(id);
  const org = (await db.select().from(organisations).where(eq(organisations.id, id)))[0];
  if (!org) return null;
  const assessment = (
    await db.select().from(assessments).where(eq(assessments.organisationId, id))
  )[0];
  if (!assessment) return null;

  const [score, scenarioRows, evidence, recs, resDeps, supRisks] = await Promise.all([
    db.select().from(scores).where(eq(scores.assessmentId, assessment.id)),
    db.select().from(financialScenarios).where(eq(financialScenarios.assessmentId, assessment.id)),
    db.select().from(evidenceItems).where(eq(evidenceItems.assessmentId, assessment.id)),
    db.select().from(recommendations).where(eq(recommendations.assessmentId, assessment.id)),
    db.select().from(resourceDependencies).where(eq(resourceDependencies.organisationId, id)),
    db.select().from(supplierRisks).where(eq(supplierRisks.organisationId, id)),
  ]);
  const s = score[0];
  if (!s) return null;

  const byType = new Map(scenarioRows.map((r) => [r.scenarioType as ScenarioType, r]));
  const assumptionsByType = {
    baseline: byType.get("baseline")!.assumptions,
    circular_base: byType.get("circular_base")!.assumptions,
    upside: byType.get("upside")!.assumptions,
    downside: byType.get("downside")!.assumptions,
  } as Record<ScenarioType, ScenarioAssumptions>;

  return {
    org,
    assessment,
    score: s,
    bundle: bundleFor(assessment, s),
    scenarios: scenarioRows
      .map((r) => ({
        type: r.scenarioType as ScenarioType,
        label: r.label,
        assumptions: r.assumptions,
      }))
      .sort((a, b) => scenarioOrder(a.type) - scenarioOrder(b.type)),
    scenarioSet: computeScenarioSet(assessment.baseline, assumptionsByType),
    baselineEbitda: baselineEbitda(assessment.baseline),
    evidence: evidence.sort((a, b) => b.dateRecorded.getTime() - a.dateRecorded.getTime()),
    recommendations: recs,
    resourceDependencies: resDeps,
    supplierRisks: supRisks,
  };
}

function scenarioOrder(t: ScenarioType): number {
  return { baseline: 0, circular_base: 1, upside: 2, downside: 3 }[t];
}

export async function getScenarioSensitivity(
  assessmentId: string,
): Promise<{ rows: SensitivityRow[] } | null> {
  if (!process.env.DATABASE_URL) {
    const spec = BUSINESSES.find((b) => b.id === assessmentId);
    if (!spec) return null;
    const circular = deriveScenarios(spec).circular_base;
    return { rows: runSensitivity(spec.baseline, circular, baselineEbitda(spec.baseline)).rows };
  }
  const assessment = (
    await db.select().from(assessments).where(eq(assessments.id, assessmentId))
  )[0];
  if (!assessment) return null;
  const circular = (
    await db
      .select()
      .from(financialScenarios)
      .where(eq(financialScenarios.assessmentId, assessmentId))
  ).find((r) => r.scenarioType === "circular_base");
  if (!circular) return null;
  const { rows } = runSensitivity(
    assessment.baseline,
    circular.assumptions,
    baselineEbitda(assessment.baseline),
  );
  return { rows };
}

export async function getSectorBenchmarks() {
  if (!process.env.DATABASE_URL) {
    const agg = new Map<string, { v: number; r: number; i: number; capex: number; n: number; models: Map<string, number> }>();
    for (const spec of BUSINESSES) {
      const bundle = computeScores(spec.inputs, SEED_DATE.toISOString());
      const a = agg.get(spec.sector) ?? { v: 0, r: 0, i: 0, capex: 0, n: 0, models: new Map<string, number>() };
      a.v += bundle.viability.score;
      a.r += bundle.resilience.score;
      a.i += bundle.investor.score;
      a.capex += spec.inputs.capexRequirement;
      a.n += 1;
      for (const model of spec.circularModels) a.models.set(model, (a.models.get(model) ?? 0) + 1);
      agg.set(spec.sector, a);
    }
    return [...agg.entries()]
      .map(([sector, a], idx) => ({
        id: `benchmark-${idx}`,
        sector,
        avgViability: Math.round((a.v / a.n) * 10) / 10,
        avgResilience: Math.round((a.r / a.n) * 10) / 10,
        avgInvestor: Math.round((a.i / a.n) * 10) / 10,
        avgCapexRequirement: Math.round(a.capex / a.n),
        commonModel: [...a.models.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? "—",
      }))
      .sort((a, b) => b.avgViability - a.avgViability);
  }
  return db.select().from(sectorBenchmarks).orderBy(desc(sectorBenchmarks.avgViability));
}

export async function getProgrammeInsights() {
  if (!process.env.DATABASE_URL) {
    return PROGRAMME_INSIGHTS.map((row, idx) => ({ id: `programme-${idx}`, ...row }));
  }
  return db.select().from(programmeInsights);
}

export async function getAuditEvents(limit = 40) {
  if (!process.env.DATABASE_URL) {
    return demoSummaries().slice(0, limit).map((summary, idx) => ({
      id: `audit-${idx}`,
      action: "assessment.seeded",
      entityType: "assessment",
      entityId: summary.assessment.id,
      actor: "demo",
      detail: `Synthetic assessment available for ${summary.org.name} with headline score ${summary.score.headline}.`,
      createdAt: new Date(SEED_DATE.getTime() - idx * 60000),
    }));
  }
  return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(limit);
}

export async function getScenariosForAssessment(assessmentId: string) {
  if (!process.env.DATABASE_URL) {
    const spec = BUSINESSES.find((b) => b.id === assessmentId);
    const summary = demoSummary(assessmentId);
    if (!spec || !summary) return null;
    const scenarios = deriveScenarios(spec);
    return {
      assessment: summary.assessment,
      rows: (Object.keys(scenarios) as ScenarioType[]).map((type, idx) => ({
        id: `scenario-${assessmentId}-${idx}`,
        assessmentId,
        scenarioType: type,
        label: SCENARIO_LABELS[type],
        assumptions: scenarios[type],
        updatedAt: SEED_DATE,
      })),
    };
  }
  const assessment = (
    await db.select().from(assessments).where(eq(assessments.id, assessmentId))
  )[0];
  if (!assessment) return null;
  const rows = await db
    .select()
    .from(financialScenarios)
    .where(eq(financialScenarios.assessmentId, assessmentId));
  return { assessment, rows };
}