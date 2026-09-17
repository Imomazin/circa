import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAssessment,
  saveScenario,
  updateStage,
  DomainError,
} from "@/lib/services/portfolio";
import {
  assertOrigin,
  apiWorkspace,
  apiError,
  readBody,
} from "@/lib/services/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, ctx: Context) {
  try {
    const w = await apiWorkspace(req);
    const { id } = await ctx.params;
    const result = await getAssessment(w.id, id);
    if (!result) throw new DomainError("Assessment not found.", 404);
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(req: NextRequest, ctx: Context) {
  try {
    assertOrigin(req);
    const w = await apiWorkspace(req);
    const { id } = await ctx.params;
    z.uuid().parse(id);
    const body = await readBody(req);
    if (body.action === "stage") {
      await updateStage(w.id, id, z.string().parse(body.stage));
      return NextResponse.json({ ok: true });
    }
    const command = z
      .object({
        scenarioId: z.uuid(),
        version: z.number().int().min(1),
        input: z.unknown(),
      })
      .parse(body);
    return NextResponse.json(
      await saveScenario(
        w.id,
        id,
        command.scenarioId,
        command.version,
        command.input,
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
