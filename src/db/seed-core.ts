import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { BUSINESSES, PROGRAMME_INSIGHTS, type BusinessSpec } from "./seed-data";
import { computeScores, headlineScore } from "../domain/scoring";
import { generateRecommendations } from "../domain/recommendations/engine";
import { baselineAssumptions, type ScenarioAssumptions } from "../domain/scenarios/model";
import { SCENARIO_LABELS, type ScenarioType } from "../domain/constants";

/**
 * Reusable, deterministic seed routine.
 *
 * Shared by the CLI seed script (`npm run db:seed`) and the in-app
 * "Reset demo data" action. Scores, scenarios and recommendations are DERIVED
 * from the domain engine so the database always matches the engine.
 */

export const SEED_DATE = new Date("2026-09-01T09:00:00.000Z");
const SEED_ISO = SEED_DATE.toISOString();

function monthsBefore(months: number): Date {
  const d = new Date(SEED_DATE);
  d.setMonth(d.getMonth() - months);
  return d;
}

export function deriveScenarios(spec: BusinessSpec): Record<ScenarioType, ScenarioAssumptions> {
  const c = spec.circular;
  return {
    baseline: baselineAssumptions(spec.baseline),
    circular_base: c,
    upside: {
      ...c,
      revenueDeltaPct: c.revenueDeltaPct + 8,
      materialCostDeltaPct: c.materialCostDeltaPct - 3,
      recurringRevenueSharePct: Math.min(100, c.recurringRevenueSharePct + 8),
      customerRetentionPct: Math.min(100, c.customerRetentionPct + 5),
    },
    downside: {
      ...c,
      revenueDeltaPct: c.revenueDeltaPct - 12,
      materialCostDeltaPct: c.materialCostDeltaPct + 8,
      energyCostDeltaPct: c.energyCostDeltaPct + 6,
      capex: Math.round(c.capex * 1.1),
      customerRetentionPct: Math.max(0, c.customerRetentionPct - 8),
    },
  };
}

type DB = NeonHttpDatabase<typeof schema>;

/** Clear all rows then insert the deterministic demonstrator dataset. */
export async function seedDatabase(db: DB): Promise<{ businesses: number }> {
  await db.delete(schema.auditEvents);
  await db.delete(schema.programmeInsights);
  await db.delete(schema.sectorBenchmarks);
  await db.delete(schema.recommendations);
  await db.delete(schema.evidenceItems);
  await db.delete(schema.financialScenarios);
  await db.delete(schema.scores);
  await db.delete(schema.supplierRisks);
  await db.delete(schema.resourceDependencies);
  await db.delete(schema.assessments);
  await db.delete(schema.demoUsers);
  await db.delete(schema.organisations);

  const sectorAgg = new Map<
    string,
    { v: number; r: number; i: number; capex: number; n: number; models: Map<string, number> }
  >();

  for (const spec of BUSINESSES) {
    await db.insert(schema.organisations).values({
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
    });

    const assessmentId = spec.id;
    await db.insert(schema.assessments).values({
      id: assessmentId,
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
    });

    const bundle = computeScores(spec.inputs, SEED_ISO);
    const headline = headlineScore(bundle);
    await db.insert(schema.scores).values({
      assessmentId,
      headline,
      viability: bundle.viability.score,
      resilience: bundle.resilience.score,
      investor: bundle.investor.score,
      opportunity: bundle.opportunity.score,
      evidence: bundle.evidence.score,
      calculatedAt: SEED_DATE,
    });

    const scenarios = deriveScenarios(spec);
    for (const type of Object.keys(scenarios) as ScenarioType[]) {
      await db.insert(schema.financialScenarios).values({
        assessmentId,
        scenarioType: type,
        label: SCENARIO_LABELS[type],
        assumptions: scenarios[type],
        updatedAt: SEED_DATE,
      });
    }

    for (const ev of spec.evidence) {
      await db.insert(schema.evidenceItems).values({
        assessmentId,
        type: ev.type,
        description: ev.description,
        source: ev.source,
        confidence: ev.confidence,
        linkedArea: ev.linkedArea,
        status: ev.status,
        dateRecorded: monthsBefore(ev.agedMonths),
      });
    }

    for (const r of generateRecommendations(spec.inputs, bundle)) {
      await db.insert(schema.recommendations).values({
        assessmentId,
        code: r.code,
        title: r.title,
        rationale: r.rationale,
        priority: r.priority,
        category: r.category,
      });
    }

    for (const rd of spec.resourceDeps) {
      await db.insert(schema.resourceDependencies).values({
        organisationId: spec.id,
        material: rd.material,
        criticality: rd.criticality,
        annualSpend: rd.annualSpend,
        volatility: rd.volatility,
        notes: rd.notes,
      });
    }
    for (const sr of spec.supplierRisks) {
      await db.insert(schema.supplierRisks).values({
        organisationId: spec.id,
        supplier: sr.supplier,
        category: sr.category,
        shareOfSupplyPct: sr.shareOfSupplyPct,
        region: sr.region,
        riskLevel: sr.riskLevel,
      });
    }

    await db.insert(schema.auditEvents).values({
      action: "assessment.seeded",
      entityType: "assessment",
      entityId: assessmentId,
      actor: "seed",
      detail: `Seeded assessment for ${spec.name} with headline score ${headline}.`,
      createdAt: SEED_DATE,
    });

    const agg =
      sectorAgg.get(spec.sector) ??
      { v: 0, r: 0, i: 0, capex: 0, n: 0, models: new Map<string, number>() };
    agg.v += bundle.viability.score;
    agg.r += bundle.resilience.score;
    agg.i += bundle.investor.score;
    agg.capex += spec.inputs.capexRequirement;
    agg.n += 1;
    for (const m of spec.circularModels) agg.models.set(m, (agg.models.get(m) ?? 0) + 1);
    sectorAgg.set(spec.sector, agg);
  }

  for (const [sector, agg] of sectorAgg) {
    const commonModel = [...agg.models.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    await db.insert(schema.sectorBenchmarks).values({
      sector,
      avgViability: Math.round((agg.v / agg.n) * 10) / 10,
      avgResilience: Math.round((agg.r / agg.n) * 10) / 10,
      avgInvestor: Math.round((agg.i / agg.n) * 10) / 10,
      avgCapexRequirement: Math.round(agg.capex / agg.n),
      commonModel,
    });
  }

  for (const pi of PROGRAMME_INSIGHTS) {
    await db.insert(schema.programmeInsights).values(pi);
  }

  return { businesses: BUSINESSES.length };
}
