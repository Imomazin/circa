import { randomUUID, createHash } from "node:crypto";
import { and, eq, desc, gt } from "drizzle-orm";
import { db } from "../db";
import * as t from "../db/schema";
import { seedInputs } from "../demo/fixtures";
import {
  scoreAssessment,
  scenarioVariants,
  modelScenario,
} from "../scoring/commercial";
import {
  assessmentSchema,
  scenarioSchema,
  stages,
  type AssessmentInput,
} from "../validation/assessment";

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Transaction = Parameters<
  Parameters<ReturnType<typeof db>["transaction"]>[0]
>[0];

async function insertAssessment(
  tx: Transaction,
  workspaceId: string,
  input: AssessmentInput,
  index?: number,
) {
  const organisationId = randomUUID(),
    assessmentId = randomUUID();
  await tx
    .insert(t.organisations)
    .values({
      id: organisationId,
      workspaceId,
      name: input.name,
      sector: input.sector,
      region: input.region,
      size: input.size,
    });
  await tx
    .insert(t.assessments)
    .values({
      id: assessmentId,
      workspaceId,
      organisationId,
      inputs: input,
      stage: index === undefined ? "Assessment" : stages[index % stages.length],
      createdAt:
        index === undefined
          ? new Date()
          : new Date(`2026-09-${String(index + 1).padStart(2, "0")}T09:00:00Z`),
    });
  await tx
    .insert(t.scenarios)
    .values(
      scenarioVariants(input.scenario).map((s) => ({
        id: randomUUID(),
        assessmentId,
        name: s.name,
        inputs: s.input,
        scores: scoreAssessment(input.factors, input.baseline, s.input),
      })),
    );
  await tx.insert(t.evidence).values(
    [
      {
        title: "Customer interviews",
        category: "Demand",
        quality: input.factors.demand,
      },
      {
        title: "Operating cost estimates",
        category: "Financial",
        quality: input.factors.evidence,
      },
      {
        title: "Supplier alternatives",
        category: "Resilience",
        quality: 100 - input.factors.supplierConcentration,
      },
      {
        title: "Trading and pilot results",
        category: "Market",
        quality: input.factors.traction,
      },
    ].map((e) => ({
      ...e,
      id: randomUUID(),
      assessmentId,
      status:
        e.quality >= 70
          ? "Illustrative evidence"
          : e.quality >= 45
            ? "Partial"
            : "Evidence gap",
      source: "Synthetic fixture; no external document verified",
    })),
  );
  return assessmentId;
}
export async function createWorkspace(token: string, fixture = false) {
  const workspaceId = randomUUID();
  return db().transaction(async (tx) => {
    await tx
      .insert(t.workspaces)
      .values({
        id: workspaceId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + (fixture ? 3650 : 30) * 86400000),
      });
    for (const [i, input] of seedInputs().entries())
      await insertAssessment(tx, workspaceId, input, i);
    await tx
      .insert(t.audit)
      .values({
        id: randomUUID(),
        workspaceId,
        action: "Demo workspace created",
        detail: "12 synthetic assessments and 36 financial scenarios seeded.",
        actor: "System",
      });
    return workspaceId;
  });
}
export async function workspaceForToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const [row] = await db()
    .select()
    .from(t.workspaces)
    .where(
      and(
        eq(t.workspaces.tokenHash, hashToken(token)),
        gt(t.workspaces.expiresAt, new Date()),
      ),
    );
  return row ?? null;
}
export async function getPortfolio(workspaceId: string) {
  const rows = await db()
    .select({
      assessment: t.assessments,
      organisation: t.organisations,
      scenario: t.scenarios,
    })
    .from(t.assessments)
    .innerJoin(
      t.organisations,
      eq(t.organisations.id, t.assessments.organisationId),
    )
    .innerJoin(
      t.scenarios,
      and(
        eq(t.scenarios.assessmentId, t.assessments.id),
        eq(t.scenarios.name, "Circular base case"),
      ),
    )
    .where(eq(t.assessments.workspaceId, workspaceId))
    .orderBy(desc(t.assessments.createdAt));
  return rows.map((r) => ({
    ...r,
    financial: modelScenario(r.assessment.inputs.baseline, r.scenario.inputs),
  }));
}
export type PortfolioRow = Awaited<ReturnType<typeof getPortfolio>>[number];
export async function getAssessment(workspaceId: string, id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  const [row] = await db()
    .select({ assessment: t.assessments, organisation: t.organisations })
    .from(t.assessments)
    .innerJoin(
      t.organisations,
      eq(t.organisations.id, t.assessments.organisationId),
    )
    .where(
      and(eq(t.assessments.id, id), eq(t.assessments.workspaceId, workspaceId)),
    );
  if (!row) return null;
  const [scenarios, evidence, events] = await Promise.all([
    db()
      .select()
      .from(t.scenarios)
      .where(eq(t.scenarios.assessmentId, id))
      .orderBy(t.scenarios.name),
    db().select().from(t.evidence).where(eq(t.evidence.assessmentId, id)),
    db()
      .select()
      .from(t.audit)
      .where(
        and(eq(t.audit.workspaceId, workspaceId), eq(t.audit.assessmentId, id)),
      )
      .orderBy(desc(t.audit.createdAt)),
  ]);
  return { ...row, scenarios, evidence, events };
}
export async function createAssessment(workspaceId: string, raw: unknown) {
  const input = assessmentSchema.parse(raw);
  return db().transaction(async (tx) => {
    const id = await insertAssessment(tx, workspaceId, input);
    await tx
      .insert(t.audit)
      .values({
        id: randomUUID(),
        workspaceId,
        assessmentId: id,
        action: "Assessment created",
        detail:
          "Validated commercial inputs and three scenario variants saved.",
      });
    return id;
  });
}
export async function saveScenario(
  workspaceId: string,
  id: string,
  scenarioId: string,
  version: number,
  raw: unknown,
) {
  const input = scenarioSchema.parse(raw);
  return db().transaction(async (tx) => {
    const [assessment] = await tx
      .select()
      .from(t.assessments)
      .where(
        and(
          eq(t.assessments.id, id),
          eq(t.assessments.workspaceId, workspaceId),
        ),
      )
      .for("update");
    if (!assessment) throw new DomainError("Assessment not found.", 404);
    const scores = scoreAssessment(
      assessment.inputs.factors,
      assessment.inputs.baseline,
      input,
    );
    const [saved] = await tx
      .update(t.scenarios)
      .set({
        inputs: input,
        scores,
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(t.scenarios.id, scenarioId),
          eq(t.scenarios.assessmentId, id),
          eq(t.scenarios.version, version),
        ),
      )
      .returning();
    if (!saved)
      throw new DomainError(
        "This scenario has changed. Reload before saving again.",
        409,
      );
    await tx
      .update(t.assessments)
      .set({ updatedAt: new Date() })
      .where(eq(t.assessments.id, id));
    await tx
      .insert(t.audit)
      .values({
        id: randomUUID(),
        workspaceId,
        assessmentId: id,
        action: "Scenario recalculated",
        detail: `${saved.name} saved at revision ${saved.version}; all five prototype scores recalculated.`,
      });
    return saved;
  });
}
export async function updateStage(
  workspaceId: string,
  id: string,
  stage: string,
) {
  if (!(stages as readonly string[]).includes(stage))
    throw new DomainError("Choose a valid assessment stage.");
  return db().transaction(async (tx) => {
    const [saved] = await tx
      .update(t.assessments)
      .set({ stage, updatedAt: new Date() })
      .where(
        and(
          eq(t.assessments.id, id),
          eq(t.assessments.workspaceId, workspaceId),
        ),
      )
      .returning({ id: t.assessments.id });
    if (!saved) throw new DomainError("Assessment not found.", 404);
    await tx
      .insert(t.audit)
      .values({
        id: randomUUID(),
        workspaceId,
        assessmentId: id,
        action: "Assessment progressed",
        detail: `Stage changed to ${stage}.`,
      });
  });
}
export async function resetWorkspace(workspaceId: string) {
  return db().transaction(async (tx) => {
    await tx
      .select()
      .from(t.workspaces)
      .where(eq(t.workspaces.id, workspaceId))
      .for("update");
    await tx
      .delete(t.organisations)
      .where(eq(t.organisations.workspaceId, workspaceId));
    for (const [i, input] of seedInputs().entries())
      await insertAssessment(tx, workspaceId, input, i);
    await tx
      .insert(t.audit)
      .values({
        id: randomUUID(),
        workspaceId,
        action: "Demo reset",
        detail:
          "Only this presenter workspace restored to the deterministic seed.",
      });
  });
}
export async function getAudit(workspaceId: string) {
  return db()
    .select()
    .from(t.audit)
    .where(eq(t.audit.workspaceId, workspaceId))
    .orderBy(desc(t.audit.createdAt))
    .limit(100);
}
