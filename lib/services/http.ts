import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { workspaceForToken, DomainError } from "./portfolio";
import { cookieName } from "./session";
export function assertOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const expected = new URL(req.url).origin;
  if (!origin || origin !== expected)
    throw new DomainError("Request origin was not accepted.", 403);
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new DomainError("JSON content is required.", 415);
  if (Number(req.headers.get("content-length") ?? 0) > 24000)
    throw new DomainError("Request is too large.", 413);
}
export async function readBody(req: NextRequest) {
  const text = await req.text();
  if (text.length > 24000) throw new DomainError("Request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError("Invalid JSON.");
  }
}
export async function apiWorkspace(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  const w = token ? await workspaceForToken(token) : null;
  if (!w) throw new DomainError("Open a demonstration first.", 401);
  return w;
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: "Check the highlighted inputs.", issues: error.issues },
      { status: 422 },
    );
  if (error instanceof DomainError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error(
    JSON.stringify({
      event: "request_failed",
      kind: error instanceof Error ? error.name : "UnknownError",
    }),
  );
  return NextResponse.json(
    { error: "The request could not be completed. Please retry." },
    { status: 500 },
  );
}
