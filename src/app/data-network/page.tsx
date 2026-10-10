import type { Metadata } from "next";
import { PageHeader, StatTile, SectionTitle } from "@/components/primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataGraph } from "@/components/intelligence/data-graph";
import { getIntegrationLandscape, type ConnectorView } from "@/server/integrations";
import { CONNECTOR_CATEGORIES } from "@/integrations/types";
import { CONNECTOR_BY_ID } from "@/integrations/registry";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Data network" };

const STATUS_STYLE: Record<string, string> = {
  "DEMO DATA": "bg-evergreen-100 text-evergreen-800 dark:bg-evergreen-800/40 dark:text-evergreen-100",
  "READY TO CONFIGURE": "border border-copper-300 text-copper-700 dark:text-copper-200",
  "API ACCESS REQUIRED": "border border-border-strong text-muted-foreground",
  SANDBOX: "bg-copper-100 text-copper-700 dark:bg-copper-400/15 dark:text-copper-200",
  LIVE: "bg-evergreen-700 text-white",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-[0.3rem] px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider", STATUS_STYLE[status] ?? "border border-border-strong text-muted-foreground")}>
      {status}
    </span>
  );
}

const DIRECTION_LABEL: Record<string, string> = {
  inbound: "Inbound ↓",
  outbound: "Outbound ↑",
  bidirectional: "Two-way ↕",
};

export default function DataNetworkPage() {
  const { connectors, events, summary, graph } = getIntegrationLandscape();
  const nowRef = Math.max(...connectors.map((c) => c.lastSync ?? 0));

  function rel(ts: number | null): string {
    if (!ts) return "—";
    const mins = Math.max(1, Math.round((nowRef - ts) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Data network"
        title="Integration marketplace"
        description="CIRCA is the intelligence layer over the enterprise data estate. ERP, procurement, organisation, waste, carbon and logistics signals feed one opportunity engine. Connector states are shown honestly — live connections are never implied."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Connectors" value={connectors.length} accent="evergreen" sublabel={`${summary.categories} categories`} />
        <StatTile label="Powering the demo" value={summary.demo} accent="evergreen" sublabel="DEMO DATA" />
        <StatTile label="Ready to configure" value={summary.ready} accent="copper" sublabel="Credentials required" />
        <StatTile label="Records in play" value={formatNumber(summary.totalRecords)} sublabel="Across demo connectors" />
      </div>

      {/* Commercial data graph */}
      <div className="mb-9">
        <SectionTitle hint="How connected data becomes an opportunity">Commercial data graph</SectionTitle>
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <DataGraph nodes={graph.nodes} edges={graph.edges} />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border pt-3 text-2xs text-muted-foreground">
            <Legend swatch="bg-card border border-border-strong" label="External source" />
            <Legend swatch="bg-evergreen-700" label="CIRCA core" />
            <Legend swatch="bg-copper-500" label="Match engine" />
            <Legend swatch="bg-graphite-800" label="Output / action" />
          </div>
        </div>
      </div>

      {/* Marketplace by category */}
      <SectionTitle hint={`${connectors.length} connectors`}>Connectors</SectionTitle>
      <div className="flex flex-col gap-7">
        {CONNECTOR_CATEGORIES.map((category) => {
          const rows = connectors.filter((c) => c.category === category);
          if (rows.length === 0) return null;
          return <CategoryBlock key={category} category={category} rows={rows} rel={rel} />;
        })}
      </div>

      {/* Sync feed */}
      <div className="mt-9">
        <SectionTitle hint="Most recent, from DEMO DATA connectors">Sync activity</SectionTitle>
        <div className="rounded-lg border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connector</TableHead>
                <TableHead>Object</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-foreground">{CONNECTOR_BY_ID.get(e.connectorId)?.name ?? e.connectorId}</TableCell>
                  <TableCell className="text-muted-foreground">{e.object}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(e.records)}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "ok" ? "evergreen" : "amber"}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-2xs text-muted-foreground">{rel(e.at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function CategoryBlock({
  category,
  rows,
  rel,
}: {
  category: string;
  rows: ConnectorView[];
  rel: (ts: number | null) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-display text-sm font-semibold tracking-tight text-foreground">{category}</h3>
        <span className="text-2xs text-muted-foreground">{rows.length}</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Connector</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Objects</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead>Last sync</TableHead>
              <TableHead>Auth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.health === "Healthy" ? "bg-evergreen-500" : "bg-stone-400")}
                      title={c.health}
                    />
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-2xs text-muted-foreground">{c.role}</p>
                      {c.note && <p className="mt-0.5 text-2xs italic text-copper-600 dark:text-copper-300">{c.note}</p>}
                      {c.writeBack && (
                        <p className="mt-0.5 text-2xs text-muted-foreground">Write-back: {c.writeBack.join(", ")}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell><StatusPill status={c.status} /></TableCell>
                <TableCell className="whitespace-nowrap text-2xs text-muted-foreground">{DIRECTION_LABEL[c.direction]}</TableCell>
                <TableCell>
                  <div className="flex max-w-[16rem] flex-wrap gap-1">
                    {c.objects.slice(0, 3).map((o) => (
                      <Badge key={o} variant="outline">{o}</Badge>
                    ))}
                    {c.objects.length > 3 && <span className="text-2xs text-muted-foreground">+{c.objects.length - 3}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{c.records ? formatNumber(c.records) : "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-2xs text-muted-foreground">{rel(c.lastSync)}</TableCell>
                <TableCell className="whitespace-nowrap text-2xs text-muted-foreground">{c.auth}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-3 rounded-[2px]", swatch)} /> {label}
    </span>
  );
}
