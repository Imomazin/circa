"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import {
  organisations,
  financialScenarios,
  evidenceItems,
  recommendations,
  assessments,
  scores,
  auditEvents,
} from "@/db/schema";
import { seedDatabase } from "@/db/seed-core";
import { computeScores, headlineScore } from "@/domain/scoring";
import { generateRecommendations } from "@/domain/recommendations/engine";
import { computeScenario } from "@/domain/scenarios/model";
import { deriveScenarioAssumptions } from "@/domain/scenarios/derive";
import {
  updateScenarioSchema,
  recalculateSchema,
  updateAssessmentSchema,
  createBusinessSchema,
  addEvidenceSchema,
  deleteEvidenceSchema,
  scenarioAssumptionsSchema,
} from "@/lib/validation";
import { SCENARIO_LABELS, type ScenarioType } from "@/domain/constants";
import type { AssessmentInputs } from "@/domain/scoring/types";
import type { ScenarioAssumptionsInput, CreateBusinessInput } from "@/lib/validation";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "business";
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

/**
 * Persist edited scenario assumptions and log an audit event.
 * Called by the scenario modeller when the user changes assumptions.
 */
export async function updateScenarioAction(input: {
  assessmentId: string;
  scenarioType: ScenarioType;
  assumptions: ScenarioAssumptionsInput;
}): Promise<ActionResult> {
  const parsed = updateScenarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid scenario input." };
  }
  const { assessmentId, scenarioType, assumptions } = parsed.data;

  await db
    .update(financialScenarios)
    .set({ assumptions, updatedAt: new Date() })
    .where(
      and(
        eq(financialScenarios.assessmentId, assessmentId),
        eq(financialScenarios.scenarioType, scenarioType),
      ),
    );

  await db.insert(auditEvents).values({
    action: "scenario.updated",
    entityType: "scenario",
    entityId: `${assessmentId}:${scenarioType}`,
    actor: "demo-user",
    detail: `Updated ${scenarioType} scenario assumptions.`,
  });

  revalidatePath(`/scenarios/${assessmentId}`);
  revalidatePath(`/businesses/${assessmentId}`);
  revalidatePath(`/investor-readiness/${assessmentId}`);
  return { ok: true, message: "Scenario saved." };
}

/**
 * Recalculate and persist the score summary for an assessment from its stored
 * inputs, updating the recalculation timestamp.
 */
export async function recalculateScoresAction(input: {
  assessmentId: string;
}): Promise<ActionResult> {
  const parsed = recalculateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const { assessmentId } = parsed.data;

  const assessment = (
    await db.select().from(assessments).where(eq(assessments.id, assessmentId))
  )[0];
  if (!assessment) return { ok: false, message: "Assessment not found." };

  const now = new Date();
  const bundle = computeScores(assessment.inputs, now.toISOString());
  await db
    .update(scores)
    .set({
      headline: headlineScore(bundle),
      viability: bundle.viability.score,
      resilience: bundle.resilience.score,
      investor: bundle.investor.score,
      opportunity: bundle.opportunity.score,
      evidence: bundle.evidence.score,
      calculatedAt: now,
    })
    .where(eq(scores.assessmentId, assessmentId));

  await db.insert(auditEvents).values({
    action: "score.recalculated",
    entityType: "assessment",
    entityId: assessmentId,
    actor: "demo-user",
    detail: `Recalculated scores (headline ${headlineScore(bundle)}).`,
  });

  revalidatePath(`/businesses/${assessmentId}`);
  revalidatePath("/");
  return { ok: true, message: "Scores recalculated." };
}

/**
 * Persist edited assessment inputs, then recompute and persist scores.
 * This is how the multi-step assessment workflow saves its results.
 */
export async function updateAssessmentInputsAction(input: {
  assessmentId: string;
  inputs: AssessmentInputs;
}): Promise<ActionResult> {
  const parsed = updateAssessmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid assessment input." };
  const { assessmentId, inputs } = parsed.data;

  const now = new Date();
  await db
    .update(assessments)
    .set({ inputs, updatedAt: now })
    .where(eq(assessments.id, assessmentId));

  const bundle = computeScores(inputs, now.toISOString());
  await db
    .update(scores)
    .set({
      headline: headlineScore(bundle),
      viability: bundle.viability.score,
      resilience: bundle.resilience.score,
      investor: bundle.investor.score,
      opportunity: bundle.opportunity.score,
      evidence: bundle.evidence.score,
      calculatedAt: now,
    })
    .where(eq(scores.assessmentId, assessmentId));

  await db.insert(auditEvents).values({
    action: "assessment.updated",
    entityType: "assessment",
    entityId: assessmentId,
    actor: "demo-user",
    detail: `Assessment inputs updated; scores recalculated (headline ${headlineScore(bundle)}).`,
  });

  revalidatePath(`/businesses/${assessmentId}`);
  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath("/");
  return { ok: true, message: "Assessment saved and scores recalculated." };
}

export interface CreateResult extends ActionResult {
  id?: string;
}

/**
 * Create a new business and its circular-opportunity assessment, deriving the
 * four financial scenarios, the five scores and the recommendation set from the
 * engine — the same way the seed does, so a user-created business is
 * indistinguishable from a seeded one.
 */
export async function createBusinessAction(input: CreateBusinessInput): Promise<CreateResult> {
  const parsed = createBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please complete all required fields with valid values." };
  }
  const data = parsed.data;

  // Unique slug.
  const base = slugify(data.name);
  let id = base;
  for (let n = 2; n < 100; n++) {
    const existing = await db.select({ id: organisations.id }).from(organisations).where(eq(organisations.id, id));
    if (existing.length === 0) break;
    id = `${base}-${n}`;
  }

  // Keep the engine inputs financially consistent with the circular scenario.
  const circularResult = computeScenario(data.baseline, data.circular);
  const baselineCosts =
    data.baseline.materialCost +
    data.baseline.energyCost +
    data.baseline.labourCost +
    data.baseline.opex +
    data.baseline.maintenanceCost;
  const circularCosts = circularResult.cogs + circularResult.operatingCosts;
  const inputs: AssessmentInputs = {
    ...data.inputs,
    capexRequirement: data.circular.capex,
    annualRevenueUplift: Math.max(0, Math.round(circularResult.revenue - data.baseline.revenue)),
    annualCostSaving: Math.max(0, Math.round(baselineCosts - circularCosts)),
    paybackYears: circularResult.paybackYears ?? data.inputs.paybackYears,
  };

  const now = new Date();
  await db.insert(organisations).values({
    id,
    name: data.name,
    sector: data.sector,
    companySize: data.companySize,
    region: data.region,
    description: data.description,
    currentOperatingModel: data.currentOperatingModel,
    currentRevenueModel: data.currentRevenueModel,
    productsServices: data.productsServices,
    customerModel: data.customerModel,
    commercialPressures: data.commercialPressures,
    createdAt: now,
  });

  await db.insert(assessments).values({
    id,
    organisationId: id,
    title: `${data.name} — circular opportunity assessment`,
    stage: data.stage,
    circularModels: data.circularModels,
    opportunitySummary: data.opportunitySummary,
    commercialRationale: data.commercialRationale,
    inputs,
    baseline: data.baseline,
    createdAt: now,
    updatedAt: now,
  });

  const bundle = computeScores(inputs, now.toISOString());
  await db.insert(scores).values({
    assessmentId: id,
    headline: headlineScore(bundle),
    viability: bundle.viability.score,
    resilience: bundle.resilience.score,
    investor: bundle.investor.score,
    opportunity: bundle.opportunity.score,
    evidence: bundle.evidence.score,
    calculatedAt: now,
  });

  const scenarios = deriveScenarioAssumptions(data.baseline, data.circular);
  for (const type of Object.keys(scenarios) as ScenarioType[]) {
    await db.insert(financialScenarios).values({
      assessmentId: id,
      scenarioType: type,
      label: SCENARIO_LABELS[type],
      assumptions: scenarios[type],
      updatedAt: now,
    });
  }

  for (const r of generateRecommendations(inputs, bundle)) {
    await db.insert(recommendations).values({
      assessmentId: id,
      code: r.code,
      title: r.title,
      rationale: r.rationale,
      priority: r.priority,
      category: r.category,
    });
  }

  await db.insert(auditEvents).values({
    action: "business.created",
    entityType: "organisation",
    entityId: id,
    actor: "demo-user",
    detail: `Created ${data.name} with headline score ${headlineScore(bundle)}.`,
    createdAt: now,
  });

  revalidatePath("/");
  revalidatePath("/businesses");
  revalidatePath("/assessments");
  return { ok: true, message: "Business created.", id };
}

/** Add an evidence item to an assessment. */
export async function addEvidenceAction(input: {
  assessmentId: string;
  type: string;
  description: string;
  source: string;
  confidence: number;
  linkedArea: string;
  status: string;
}): Promise<ActionResult> {
  const parsed = addEvidenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid evidence item." };
  const d = parsed.data;

  const assessment = (
    await db.select({ id: assessments.id }).from(assessments).where(eq(assessments.id, d.assessmentId))
  )[0];
  if (!assessment) return { ok: false, message: "Assessment not found." };

  await db.insert(evidenceItems).values({
    assessmentId: d.assessmentId,
    type: d.type,
    description: d.description,
    source: d.source,
    confidence: d.confidence,
    linkedArea: d.linkedArea,
    status: d.status,
    dateRecorded: new Date(),
  });
  await db.insert(auditEvents).values({
    action: "evidence.added",
    entityType: "assessment",
    entityId: d.assessmentId,
    actor: "demo-user",
    detail: `Added ${d.type} evidence for ${d.linkedArea}.`,
  });

  revalidatePath(`/businesses/${d.assessmentId}`);
  revalidatePath(`/assessments/${d.assessmentId}`);
  return { ok: true, message: "Evidence added." };
}

/** Remove an evidence item from an assessment. */
export async function deleteEvidenceAction(input: {
  assessmentId: string;
  evidenceId: string;
}): Promise<ActionResult> {
  const parsed = deleteEvidenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { assessmentId, evidenceId } = parsed.data;

  await db
    .delete(evidenceItems)
    .where(and(eq(evidenceItems.id, evidenceId), eq(evidenceItems.assessmentId, assessmentId)));
  await db.insert(auditEvents).values({
    action: "evidence.removed",
    entityType: "assessment",
    entityId: assessmentId,
    actor: "demo-user",
    detail: `Removed evidence item ${evidenceId}.`,
  });

  revalidatePath(`/businesses/${assessmentId}`);
  revalidatePath(`/assessments/${assessmentId}`);
  return { ok: true, message: "Evidence removed." };
}

/**
 * Reset all demonstrator data to the deterministic seed. Guarded by a typed
 * confirmation string to avoid accidental invocation.
 */
export async function resetDemoAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const confirm = formData.get("confirm");
  if (confirm !== "RESET") {
    return { ok: false, message: "Type RESET to confirm." };
  }
  try {
    const { businesses } = await seedDatabase(db);
    await db.insert(auditEvents).values({
      action: "demo.reset",
      entityType: "system",
      entityId: "demo",
      actor: "demo-user",
      detail: `Demo data reset to deterministic seed (${businesses} businesses).`,
    });
    revalidatePath("/", "layout");
    return { ok: true, message: `Demo data reset — ${businesses} businesses restored.` };
  } catch (err) {
    return { ok: false, message: `Reset failed: ${(err as Error).message}` };
  }
}

// Re-export for potential direct validation use.
export { scenarioAssumptionsSchema };
