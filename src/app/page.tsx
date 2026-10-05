import { PageHeader, StatTile } from "@/components/primitives";
import { Overview, type OverviewData } from "@/components/dashboard/overview";
import { getNetworkOverview, getOpportunities } from "@/server/network";
import { getAllBusinessSummaries } from "@/server/queries";
import { formatGBPCompact, formatTonnes, formatCarbon } from "@/lib/format";
import type { NamedValue } from "@/components/charts";

export const dynamic = "force-dynamic";

const ADVANCED = ["Pilot", "Commercial agreement", "Implementation", "Realised"];

export default async function OverviewPage() {
  const { totals, families, pipeline } = getNetworkOverview();
  const matches = getOpportunities();
  const summaries = await getAllBusinessSummaries();

  // Opportunities that need a human to move them forward (not yet advanced).
  const priority = matches
    .filter((m) => !ADVANCED.includes(m.stage))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Things that have recently progressed (furthest along first).
  const developments = [...matches]
    .filter((m) => ADVANCED.includes(m.stage))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  const familyValues: NamedValue[] = families
    .map((f) => ({ name: f.family, value: f.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const sectorViability: NamedValue[] = (() => {
    const agg = new Map<string, { sum: number; n: number }>();
    for (const s of summaries) {
      const a = agg.get(s.org.sector) ?? { sum: 0, n: 0 };
      a.sum += s.score.viability;
      a.n += 1;
      agg.set(s.org.sector, a);
    }
    return [...agg.entries()]
      .map(([name, a]) => ({ name, value: Math.round((a.sum / a.n) * 10) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  const regionActivity: NamedValue[] = (() => {
    const agg = new Map<string, number>();
    for (const m of matches) {
      agg.set(m.supplierRegion, (agg.get(m.supplierRegion) ?? 0) + 1);
      agg.set(m.buyerRegion, (agg.get(m.buyerRegion) ?? 0) + 1);
    }
    return [...agg.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  const data: OverviewData = {
    priority,
    developments,
    pipeline: pipeline.map((p) => ({ stage: p.stage, count: p.count })),
    familyValues,
    sectorViability,
    regionActivity,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Executive overview"
        title="Where circular value is moving"
        description="A single read on the circular-economy opportunities in the network — their commercial value, the material and carbon at stake, and what needs attention to progress."
      />

      <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Opportunities" value={totals.matchCount} accent="evergreen" />
        <StatTile label="Combined value" value={formatGBPCompact(totals.totalValue)} sublabel="Indicative / yr" />
        <StatTile label="Material diverted" value={formatTonnes(totals.diversionTonnes)} sublabel="From landfill / virgin" />
        <StatTile label="Carbon benefit" value={formatCarbon(totals.carbonTonnes)} accent="copper" sublabel="Indicative / yr" />
        <StatTile label="Organisations" value={totals.organisations} sublabel="In the network" />
        <StatTile label="Ready to progress" value={totals.readyToProgress} accent="evergreen" sublabel="Pilot and beyond" />
      </div>

      <Overview data={data} />
    </div>
  );
}
