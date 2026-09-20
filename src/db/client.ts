import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Server-side database client.
 *
 * Uses Neon's HTTP driver, the recommended fit for serverless Next.js on
 * Vercel. Initialised lazily so importing this module never fails at build
 * time when DATABASE_URL is absent; the error is raised only if a query is
 * actually attempted without a connection string.
 *
 * Import this only from server components, server actions or route handlers —
 * never from client components — so the connection string never reaches the
 * browser.
 */

let _db: NeonHttpDatabase<typeof schema> | null = null;

function init(): NeonHttpDatabase<typeof schema> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and provide a Neon connection string.",
    );
  }
  return drizzle(neon(connectionString), { schema });
}

/** Lazily-initialised Drizzle client, proxied so `db.select()` just works. */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    if (!_db) _db = init();
    const value = Reflect.get(_db as object, prop, receiver);
    return typeof value === "function" ? value.bind(_db) : value;
  },
});

export { schema };
