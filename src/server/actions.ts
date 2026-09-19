"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import {
  financialScenarios,
  assessments,
  scores,
  auditEvents,
} from "@/db/schema";
import { seedDatabase } from "@/db/seed-core";
import { computeScores, headlineScore } from "@/domain/scoring";
import {
  updateScenarioSchema,
  recalculateSchema,
  updateAssessmentSchema,
  scenarioAssumptionsSchema,
} from "@/lib/validation";
import type { ScenarioType } from "@/domain/constants";
import type { AssessmentInputs } from "@/domain/scoring/types";
import type { ScenarioAssumptionsInput } from "@/lib/validation";

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
