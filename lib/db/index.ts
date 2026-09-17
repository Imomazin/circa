import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema";
let pool: Pool | undefined;
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("Database configuration is unavailable.");
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 5000,
    });
    if (process.env.VERCEL) attachDatabasePool(pool);
  }
  return drizzle(pool, { schema });
}
export async function closeDb() {
  await pool?.end();
  pool = undefined;
}
