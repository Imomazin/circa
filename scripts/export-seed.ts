// Exports ORM-generated seed SQL for managed environments without direct PostgreSQL network access.
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import * as t from "../lib/db/schema";
import { seedInputs } from "../lib/demo/fixtures";
import { scenarioVariants, scoreAssessment } from "../lib/scoring/commercial";
import { stages } from "../lib/validation/assessment";
const orm = drizzle.mock();
const statements: string[] = [];
function id(key: string) {
  const h = createHash("sha256")
    .update("circa-fixture-v1:" + key)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
function add(q: { sql: string; params: unknown[] }) {
  statements.push(
    q.sql.replace(/\$(\d+)/g, (_, n) => {
      const v = q.params[Number(n) - 1];
      if (v === null) return "NULL";
      if (typeof v === "number") return String(v);
      return "'" + String(v).replaceAll("'", "''") + "'";
    }),
  );
}
const workspaceId = id("workspace");
add(
  orm
    .insert(t.workspaces)
    .values({
      id: workspaceId,
      tokenHash: "fixture-v1",
      expiresAt: new Date("2036-09-17T00:00:00Z"),
    })
    .toSQL(),
);
for (const [i, input] of seedInputs().entries()) {
  const organisationId = id("organisation-" + i),
    assessmentId = id("assessment-" + i);
  add(
    orm
      .insert(t.organisations)
      .values({
        id: organisationId,
        workspaceId,
        name: input.name,
        sector: input.sector,
        region: input.region,
        size: input.size,
      })
      .toSQL(),
  );
  add(
    orm
      .insert(t.assessments)
      .values({
        id: assessmentId,
        workspaceId,
        organisationId,
        stage: stages[i % 4],
        inputs: input,
        createdAt: new Date(
          `2026-09-${String(i + 1).padStart(2, "0")}T09:00:00Z`,
        ),
      })
      .toSQL(),
  );
  add(
    orm
      .insert(t.scenarios)
      .values(
        scenarioVariants(input.scenario).map((s, j) => ({
          id: id(`scenario-${i}-${j}`),
          assessmentId,
          name: s.name,
          inputs: s.input,
          scores: scoreAssessment(input.factors, input.baseline, s.input),
        })),
      )
      .toSQL(),
  );
  add(
    orm
      .insert(t.evidence)
      .values(
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
        ].map((e, j) => ({
          ...e,
          id: id(`evidence-${i}-${j}`),
          assessmentId,
          status:
            e.quality >= 70
              ? "Illustrative evidence"
              : e.quality >= 45
                ? "Partial"
                : "Evidence gap",
          source: "Synthetic fixture; no external document verified",
        })),
      )
      .toSQL(),
  );
}
add(
  orm
    .insert(t.audit)
    .values({
      id: id("audit"),
      workspaceId,
      action: "Demo workspace created",
      detail: "12 synthetic assessments and 36 financial scenarios seeded.",
      actor: "System",
    })
    .toSQL(),
);
writeFileSync(
  process.argv[2] ?? "/tmp/circa-seed.json",
  JSON.stringify(statements),
);
console.log(`${statements.length} ORM-generated seed statements exported.`);
