import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, closeDb } from "../lib/db";
import { workspaces } from "../lib/db/schema";
import { createWorkspace } from "../lib/services/portfolio";
config({ path: ".env.local" });
async function main() {
  const [existing] = await db()
    .select()
    .from(workspaces)
    .where(eq(workspaces.tokenHash, "fixture-v1"));
  if (existing) {
    console.log("Fixture already seeded.");
    return;
  }
  const id = await createWorkspace(randomBytes(32).toString("hex"), true);
  await db()
    .update(workspaces)
    .set({ tokenHash: "fixture-v1" })
    .where(eq(workspaces.id, id));
  console.log(
    "12 synthetic businesses, 12 assessments, 36 scenarios and 48 evidence items seeded.",
  );
}
main()
  .catch(() => {
    console.error("Seed failed.");
    process.exitCode = 1;
  })
  .finally(closeDb);
