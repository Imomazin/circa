import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, StatTile, SectionTitle, KeyValue } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { SectorHeatmap, type SectorHeatRow } from "@/components/intelligence/sector-heatmap";
import { getSectorIntelligence } from "@/server/network";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { formatGBPCompact, formatCarbon } from "@/lib/format";
import type { MaterialFamily } from "@/domain/network/types";

export const metadata: Metadata = { title: "Sector intelligence" };

export default function SectorsPage() {
  const sectors = getSectorIntelligence();
  const totalValue = sectors.reduce((n, s) => n + s.opportunityValue, 0);
  const totalCarbon = sectors.reduce((n, s) => n + s.carbonTonnes, 0);
  const rows: SectorHeatRow[] = sectors.map((s) => ({
    sector: s.sector,
    attractiveness: s.attractiveness,
    avgViability: s.avgViability,
    avgReadiness: s.avgReadiness,
    opportunityValue: s.opportunityValue,
    topFamily: s.topFamily,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Decision intelligence"
        title="Sector intelligence"
        description="A board-level read of each sector's circular-economy opportunity — commercial value, materials in play, maturity, participation, pipeline and the barriers to address."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Sectors" value={sectors.length} accent="evergreen" />
        <StatTile label="Most attractive" value={sectors[0]?.sector ?? "—"} sublabel={`Score ${sectors[0]?.attractiveness ?? 0}`} />
        <StatTile label="Originated value" value={formatGBPCompact(totalValue)} sublabel="Supplier-side, per year" />
        <StatTile label="Carbon benefit" value={formatCarbon(totalCarbon)} accent="copper" sublabel="Indicative, per year" />
      </div>

      <div className="mb-9">
        <SectionTitle>Sector attractiveness</SectionTitle>
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <SectorHeatmap rows={rows} />
          <p className="mt-3 text-2xs text-muted-foreground">
            Attractiveness blends commercial viability, circular-opportunity strength, network readiness and value scale.
          </p>
        </div>
      </div>

      <SectionTitle>Sector profiles</SectionTitle>
      <div className="flex flex-col gap-4">
        {sectors.map((s) => (
          <div key={s.sector} className="rounded-lg border border-border bg-card p-5 shadow-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-evergreen-700 text-white">
                  <span className="font-display text-xl font-semibold leading-none tabular-nums">{s.attractiveness}</span>
                  <span className="mt-0.5 text-[0.5rem] uppercase tracking-wider text-evergreen-100">score</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold tracking-tight text-foreground">{s.sector}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.orgCount} organisation{s.orgCount === 1 ? "" : "s"} · lead material {s.topFamily}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.families.slice(0, 5).map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-[2px]"
                          style={{ backgroundColor: FAMILY_FACTORS[f as MaterialFamily]?.color ?? "#185847" }}
                        />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                href="/businesses"
                className="inline-flex shrink-0 items-center gap-1 text-2xs font-medium text-evergreen-600 hover:underline"
              >
                Organisations <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-6">
              <KeyValue label="Opportunity value" value={formatGBPCompact(s.opportunityValue)} />
              <KeyValue label="Carbon / yr" value={formatCarbon(s.carbonTonnes)} />
              <KeyValue label="Opportunities" value={s.matchCount} mono={false} />
              <KeyValue label="Ready to progress" value={s.readyToProgress} mono={false} />
              <KeyValue label="Viability" value={s.avgViability.toFixed(1)} />
              <KeyValue label="Readiness" value={s.avgReadiness} />
            </div>

            {s.barriers.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <span className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                  Barriers to address
                </span>
                {s.barriers.map((b) => (
                  <Badge key={b} variant="outline">
                    {b}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
