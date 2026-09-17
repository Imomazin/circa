import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
config({ path: ".env.local" });
async function main() {
  if (!process.env.DIRECT_URL) throw new Error("DIRECT_URL is required.");
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    console.log("Migrations applied.");
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  console.error("Migration failed. Check connectivity and migration status.");
  process.exitCode = 1;
});
