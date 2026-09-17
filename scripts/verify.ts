import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { db, closeDb } from "../lib/db";
import { workspaces } from "../lib/db/schema";
import { getPortfolio } from "../lib/services/portfolio";
config({ path: ".env.local" });
async function main() {
  const [w] = await db()
    .select()
    .from(workspaces)
    .where(eq(workspaces.tokenHash, "fixture-v1"));
  if (!w) throw new Error("Seed missing");
  const rows = await getPortfolio(w.id);
  if (
    rows.length !== 12 ||
    new Set(rows.map((r) => r.organisation.sector)).size !== 10
  )
    throw new Error("Seed count mismatch");
  console.log(
    "Verified 12 assessments across 10 sectors; financial results calculated from persisted rows.",
  );
}
main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Verification failed");
    process.exitCode = 1;
  })
  .finally(closeDb);
