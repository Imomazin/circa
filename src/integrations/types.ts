/**
 * Typed connector framework.
 *
 * Every integration CIRCA can draw on is described here with an honest state.
 * No connector is ever presented as a live production connection in the
 * demonstrator: connectors that power the demo run on the deterministic
 * dataset and are marked DEMO DATA; the rest are architected and marked
 * READY TO CONFIGURE or API ACCESS REQUIRED.
 */

export const CONNECTOR_CATEGORIES = [
  "ERP",
  "Procurement",
  "CRM",
  "Organisation Intelligence",
  "Waste Data",
  "Carbon",
  "Logistics",
  "Marketplaces",
  "Data Warehouses",
  "Analytics",
] as const;
export type ConnectorCategory = (typeof CONNECTOR_CATEGORIES)[number];

/** Truthful connector states. LIVE is never asserted in the demonstrator. */
export type ConnectorStatus =
  | "LIVE"
  | "SANDBOX"
  | "DEMO DATA"
  | "READY TO CONFIGURE"
  | "API ACCESS REQUIRED";

export type DataDirection = "inbound" | "outbound" | "bidirectional";
export type AuthMethod =
  | "OAuth 2.0"
  | "API key"
  | "OData + OAuth"
  | "mTLS certificate"
  | "Service account"
  | "Partnership agreement";

export type HealthState = "Healthy" | "Degraded" | "Not connected";

export interface Connector {
  id: string;
  name: string;
  provider: string;
  category: ConnectorCategory;
  status: ConnectorStatus;
  direction: DataDirection;
  auth: AuthMethod;
  /** Business objects this connector reads or writes. */
  objects: string[];
  /** What this connector contributes to CIRCA's opportunity intelligence. */
  role: string;
  environment: "Production" | "Sandbox" | "—";
  /** Honest extra note (e.g. "Partnership connector", "Premium dataset"). */
  note?: string;
  /** Write-back capabilities, only where technically safe. */
  writeBack?: string[];
}

export interface SyncEvent {
  connectorId: string;
  object: string;
  records: number;
  at: number;
  status: "ok" | "partial" | "skipped";
}

// ── Commercial Data Graph ───────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  kind: "source" | "core" | "engine" | "output";
  /** Column 0–6 left→right. */
  col: number;
  /** Row within the column. */
  row: number;
}
export interface GraphEdge {
  from: string;
  to: string;
}
