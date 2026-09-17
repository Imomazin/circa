import { NextRequest, NextResponse } from "next/server";
import { getPortfolio, createAssessment } from "@/lib/services/portfolio";
import {
  assertOrigin,
  apiWorkspace,
  apiError,
  readBody,
} from "@/lib/services/http";
export async function GET(req: NextRequest) {
  try {
    const w = await apiWorkspace(req);
    return NextResponse.json(await getPortfolio(w.id));
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    const w = await apiWorkspace(req);
    const id = await createAssessment(w.id, await readBody(req));
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
