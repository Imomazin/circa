import assert from "node:assert/strict";
import { seedInputs } from "../lib/demo/fixtures";
const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
type Session = { cookie: string };
let checks = 0;
function check(condition: unknown, message: string) {
  assert.ok(condition, message);
  checks++;
}
async function request(
  path: string,
  options: RequestInit = {},
  session?: Session,
) {
  return fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      ...(session ? { Cookie: session.cookie } : {}),
      ...options.headers,
    },
  });
}
async function session() {
  const r = await request("/api/demo", { method: "POST", body: "{}" });
  check(r.ok, "Create demo session");
  const cookie = r.headers.get("set-cookie")?.split(";")[0];
  check(cookie, "HttpOnly session cookie");
  return { cookie: cookie! };
}
async function main() {
  check((await request("/api/health")).ok, "Database health route");
  check(
    (await request("/api/assessments")).status === 401,
    "Unauthenticated data access denied",
  );
  const a = await session(),
    b = await session();
  const rows = await (await request("/api/assessments", {}, a)).json();
  check(rows.length === 12, "12 initial scenarios");
  const id = rows[0].assessment.id;
  check(
    (await request(`/api/assessments/${id}`, {}, b)).status === 404,
    "Other session cannot read assessment",
  );
  const d = await (await request(`/api/assessments/${id}`, {}, a)).json();
  const s = d.scenarios.find(
    (x: { name: string }) => x.name === "Circular base case",
  );
  const changed = { ...s.inputs, materialSaving: 37 };
  const body = { scenarioId: s.id, version: s.version, input: changed };
  const updated = await request(
    `/api/assessments/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
    a,
  );
  check(updated.ok, "Scenario write succeeds");
  const fresh = await (await request(`/api/assessments/${id}`, {}, a)).json();
  check(
    fresh.scenarios.find((x: { id: string }) => x.id === s.id).inputs
      .materialSaving === 37,
    "Scenario survives a fresh read",
  );
  check(
    fresh.events.some(
      (x: { action: string }) => x.action === "Scenario recalculated",
    ),
    "Write creates audit event",
  );
  check(
    (
      await request(
        `/api/assessments/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        a,
      )
    ).status === 409,
    "Stale edit rejected",
  );
  check(
    (
      await request(
        `/api/assessments/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...body,
            version: s.version + 1,
            input: { ...changed, capex: -1 },
          }),
        },
        a,
      )
    ).status === 422,
    "Invalid financial value rejected",
  );
  check(
    (
      await request(
        `/api/assessments/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ action: "stage", stage: "Investment case" }),
        },
        b,
      )
    ).status === 404,
    "Other session cannot change stage",
  );
  check(
    (await request("/api/assessments", { method: "POST", body: "{}" }, a))
      .status === 422,
    "Missing fields rejected",
  );
  check(
    (
      await request(
        "/api/assessments",
        {
          method: "POST",
          body: JSON.stringify({
            ...seedInputs()[0],
            name: "Synthetic Smoke Business",
          }),
        },
        a,
      )
    ).status === 201,
    "New assessment saved",
  );
  check(
    (
      await request(
        "/api/assessments",
        {
          method: "POST",
          headers: { Origin: "https://untrusted.invalid" },
          body: "{}",
        },
        a,
      )
    ).status === 403,
    "Cross-origin request rejected",
  );
  check(
    (
      await request(
        "/api/demo",
        { method: "DELETE", body: '{"confirmation":"wrong"}' },
        a,
      )
    ).status === 400,
    "Reset requires exact confirmation",
  );
  check(
    (
      await request(
        "/api/demo",
        { method: "DELETE", body: '{"confirmation":"RESET"}' },
        a,
      )
    ).ok,
    "Own demo reset succeeds",
  );
  check(
    (await (await request("/api/assessments", {}, a)).json()).length === 12,
    "Reset restores 12 records",
  );
  check(
    (await (await request("/api/assessments", {}, b)).json()).length === 12,
    "Other session remains intact",
  );
  for (const path of [
    "/overview",
    "/assessments",
    "/assessments/new",
    "/analytics",
    "/programme",
    "/methodology",
    "/governance",
    "/demo",
    "/about",
  ])
    check((await request(path, {}, a)).ok, `Route ${path}`);
  console.log(
    `${checks} HTTP checks passed, including persistence, isolation and concurrency.`,
  );
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Smoke test failed");
  process.exitCode = 1;
});
