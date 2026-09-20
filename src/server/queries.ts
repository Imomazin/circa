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
import { computeScores, type ScoreBundle } from "@/domain/scoring";
import {
  computeScenarioSet,
  baselineEbitda,
  type ScenarioAssumptions,
  type ScenarioSet,
} from "@/domain/scenarios/model";
import { runSensitivity, type SensitivityRow } from "@/domain/scenarios/sensitivity";
import { bandForScore, confidenceForScore, type ScenarioType } from "@/domain/constants";
import type { DashboardRow } from "@/lib/view-types";

/**
 * Server-side data access. All functions run only on the server (this module is
 * marked "server-only"). Score bundles are recomputed from stored assessment
 * inputs so the engine remains the single source of truth.
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

export async function getAllBusinessSummaries(): Promise<BusinessSummary[]> {
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

/** Map a business summary to the compact row used by tables and charts. */
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

export async function getBusinessDetail(id: string): Promise<BusinessDetail | null> {
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
  return db.select().from(sectorBenchmarks).orderBy(desc(sectorBenchmarks.avgViability));
}

export async function getProgrammeInsights() {
  return db.select().from(programmeInsights);
}

export async function getAuditEvents(limit = 40) {
  return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(limit);
}

export async function getScenariosForAssessment(assessmentId: string) {
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
