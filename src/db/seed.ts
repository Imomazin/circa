import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import * as schema from "./schema";
import { seedDatabase } from "./seed-core";

/**
 * CLI seed entrypoint (`npm run db:seed`).
 *
 * Requires DATABASE_URL and outbound access to the Neon host. The seed logic
 * lives in seed-core.ts and is shared with the in-app demo-reset action.
 */
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const sql = neon(url);
  const db = drizzle(sql, { schema });
  console.log("→ Seeding Circa demonstrator data…");
  const { businesses } = await seedDatabase(db);
  console.log(`✔ Seed complete — ${businesses} businesses.`);
}

main().catch((err) => {
  console.error("✖ Seed failed:", err);
  process.exit(1);
});
