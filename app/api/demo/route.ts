import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createWorkspace,
  resetWorkspace,
  DomainError,
} from "@/lib/services/portfolio";
import {
  assertOrigin,
  apiWorkspace,
  apiError,
  readBody,
} from "@/lib/services/http";
import { cookieName } from "@/lib/services/session";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true")
      throw new DomainError("Demonstration mode is disabled.", 403);
    const token = randomBytes(32).toString("hex");
    await createWorkspace(token);
    const res = NextResponse.json({ redirect: "/overview" });
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: new URL(req.url).protocol === "https:",
      sameSite: "lax",
      maxAge: 30 * 86400,
      path: "/",
    });
    return res;
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    assertOrigin(req);
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true")
      throw new DomainError("Demonstration mode is disabled.", 403);
    const w = await apiWorkspace(req);
    const body = await readBody(req);
    if (body.confirmation !== "RESET")
      throw new DomainError("Type RESET to confirm.");
    await resetWorkspace(w.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
