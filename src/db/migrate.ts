import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { config } from "dotenv";

/**
 * Migration runner.
 *
 * Applies the generated SQL migrations in ./drizzle to the Neon database.
 * Pass --reset to drop and recreate the public schema first — used for a clean
 * deterministic rebuild of the demonstrator database (see docs/data-model.md).
 */
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const reset = process.argv.includes("--reset") || process.env.RESET === "1";
  const sql = neon(url);

  if (reset) {
    console.log("↺ Resetting public schema…");
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
  }

  const db = drizzle(sql);
  console.log("→ Applying migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✔ Migrations applied.");
}

main().catch((err) => {
  console.error("✖ Migration failed:", err);
  process.exit(1);
});
