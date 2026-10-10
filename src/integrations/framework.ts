import type { AuthMethod, SyncEvent } from "./types";

/**
 * Connector framework contracts.
 *
 * A concrete adapter declares its auth, sync behaviour and object mapping, and
 * implements `healthcheck` and `pull`/`push`. In the demonstrator adapters run
 * in DEMO mode against the deterministic dataset; the same interface accepts
 * real credentials for live deployment. Nothing here opens a network
 * connection on its own.
 */

export interface RateLimit {
  requestsPerMinute: number;
  burst: number;
}
export interface RetryPolicy {
  maxAttempts: number;
  backoff: "exponential" | "fixed";
  deadLetter: boolean;
}
export interface SyncSchedule {
  cron: string;
  mode: "full" | "incremental";
}

export interface ConnectorConfig {
  auth: AuthMethod;
  /** Env var names the adapter expects (never values). */
  credentials: string[];
  baseUrl?: string;
  rateLimit: RateLimit;
  retry: RetryPolicy;
  schedule?: SyncSchedule;
  webhook?: { events: string[] };
  /** Field mapping: external field → CIRCA field. */
  mapping: Record<string, string>;
}

export type RunMode = "demo" | "sandbox" | "live";

export interface PullResult<T> {
  object: string;
  mode: RunMode;
  records: T[];
  /** Opaque cursor for pagination; null when exhausted. */
  cursor: string | null;
  event: SyncEvent;
}

export interface Adapter<T> {
  id: string;
  config: ConnectorConfig;
  /** Describes the adapter without connecting. */
  describe(): { id: string; auth: AuthMethod; objects: string[]; mode: RunMode };
  healthcheck(mode: RunMode): { ok: boolean; mode: RunMode; detail: string };
  /** Pulls one page of an object. In demo mode, returns deterministic data. */
  pull(object: string, mode: RunMode, cursor?: string | null): PullResult<T>;
}
