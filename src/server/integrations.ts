import "server-only";
import { CONNECTORS, GRAPH_EDGES, GRAPH_NODES } from "@/integrations/registry";
import type { Connector, HealthState, SyncEvent } from "@/integrations/types";
import { enterpriseOrgs, enterpriseStreams } from "@/domain/enterprise/generate";
import { getMatches } from "@/domain/network/engine";

/**
 * Integration landscape, server-side. Record counts and sync events are
 * derived from the live demonstrator dataset so the marketplace reflects what
 * the opportunity engine is actually using — honestly labelled DEMO DATA.
 */

export interface ConnectorView extends Connector {
  records: number;
  lastSync: number | null;
  health: HealthState;
}

const DAY = 86_400_000;
const BASE = Date.UTC(2026, 8, 1, 9, 0, 0); // stable "now" for deterministic timestamps

function recordCounts(): Record<string, number> {
  const streams = enterpriseStreams();
  const orgs = enterpriseOrgs();
  const matches = getMatches();
  const supply = streams.filter((s) => s.direction === "supply");
  const demand = streams.filter((s) => s.direction === "demand");
  const bySource = (ids: string[], set: typeof supply, fallbackId: string) => {
    const counts: Record<string, number> = {};
    for (const id of ids) counts[id] = 0;
    for (const s of set) {
      const src = s.sourceConnector && ids.includes(s.sourceConnector) ? s.sourceConnector : fallbackId;
      counts[src] = (counts[src] ?? 0) + 1;
    }
    return counts;
  };
  const erp = bySource(["sap-s4hana", "dynamics-365", "oracle-fusion"], supply, "sap-s4hana");
  const proc = bySource(["coupa", "sap-ariba", "jaggaer", "ivalua"], demand, "coupa");
  return {
    ...erp,
    ...proc,
    "companies-house": orgs.filter((o) => o.verified).length,
    sepa: 34, // aggregate waste categories tracked
    climatiq: matches.length,
    openrouteservice: matches.length,
  };
}

function healthFor(c: Connector): HealthState {
  return c.status === "DEMO DATA" || c.status === "LIVE" || c.status === "SANDBOX" ? "Healthy" : "Not connected";
}

export function getConnectorViews(): ConnectorView[] {
  const counts = recordCounts();
  return CONNECTORS.map((c, i) => {
    const records = counts[c.id] ?? 0;
    const demoish = c.status === "DEMO DATA";
    return {
      ...c,
      records,
      lastSync: demoish ? BASE - (i % 6) * 1800_000 - (i % 3) * 300_000 : null,
      health: healthFor(c),
    };
  });
}

export interface IntegrationSummary {
  demo: number;
  ready: number;
  required: number;
  totalRecords: number;
  categories: number;
}

export function getIntegrationLandscape() {
  const connectors = getConnectorViews();
  const events = syntheticSyncEvents(connectors);
  const summary: IntegrationSummary = {
    demo: connectors.filter((c) => c.status === "DEMO DATA").length,
    ready: connectors.filter((c) => c.status === "READY TO CONFIGURE").length,
    required: connectors.filter((c) => c.status === "API ACCESS REQUIRED").length,
    totalRecords: connectors.reduce((n, c) => n + c.records, 0),
    categories: new Set(connectors.map((c) => c.category)).size,
  };
  return { connectors, events, summary, graph: { nodes: GRAPH_NODES, edges: GRAPH_EDGES } };
}

/** A deterministic recent sync feed from the DEMO DATA connectors. */
function syntheticSyncEvents(connectors: ConnectorView[]): SyncEvent[] {
  const demo = connectors.filter((c) => c.status === "DEMO DATA" && c.records > 0);
  const events: SyncEvent[] = [];
  demo.forEach((c, i) => {
    const object = c.objects[0];
    // two recent chunks per connector
    events.push({ connectorId: c.id, object, records: Math.ceil(c.records * 0.6), at: BASE - i * 540_000 - DAY * 0, status: "ok" });
    events.push({ connectorId: c.id, object, records: Math.floor(c.records * 0.4), at: BASE - i * 540_000 - 3_600_000, status: i % 5 === 0 ? "partial" : "ok" });
  });
  return events.sort((a, b) => b.at - a.at).slice(0, 14);
}
