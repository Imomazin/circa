import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionTitle } from "@/components/primitives";
import { StageTag, FamilyDot } from "@/components/network/elements";
import { OpportunityMatrix } from "@/components/network/opportunity-matrix";
import { SectorHeatmap, type SectorHeatRow } from "@/components/intelligence/sector-heatmap";
import { HorizontalBars, type NamedValue } from "@/components/charts";
import {
  getNetworkOverview,
  getOpportunities,
  getSectorIntelligence,
} from "@/server/network";
import { FAMILY_FACTORS } from "@/domain/network/families";
import {
  formatGBPCompact,
  formatTonnes,
  formatCarbon,
  formatGBP,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const ADVANCED = ["Pilot", "Commercial agreement", "Implementation", "Realised"];

export default function OverviewPage() {
  const { totals, families, pipeline } = getNetworkOverview();
  const matches = getOpportunities();
  const sectors = getSectorIntelligence();

  const topSector = sectors[0];
  const priority = matches
    .filter((m) => !ADVANCED.includes(m.stage))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const movements = [...matches]
    .filter((m) => ADVANCED.includes(m.stage))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);

  const familyLandscape = [...families].sort((a, b) => b.value - a.value);
  const maxFamilyValue = Math.max(...familyLandscape.map((f) => f.value), 1);
  const maxPipe = Math.max(...pipeline.map((p) => p.count), 1);

  const sectorRows: SectorHeatRow[] = sectors.slice(0, 7).map((s) => ({
    sector: s.sector,
    attractiveness: s.attractiveness,
    avgViability: s.avgViability,
    avgReadiness: s.avgReadiness,
    opportunityValue: s.opportunityValue,
    topFamily: s.topFamily,
  }));

  const regionActivity: NamedValue[] = (() => {
    const agg = new Map<string, number>();
    for (const m of matches) {
      agg.set(m.supplierRegion, (agg.get(m.supplierRegion) ?? 0) + m.value);
      agg.set(m.buyerRegion, (agg.get(m.buyerRegion) ?? 0) + m.value);
    }
    return [...agg.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  return (
    <div className="flex flex-col gap-10">
      {/* ── Briefing hero ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-8 border-b border-border pb-9 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-copper-500">
            Commercial intelligence briefing
          </p>
          <h1 className="max-w-2xl font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.015em] text-foreground sm:text-[3rem]">
            Where circular value is concentrating
          </h1>
          <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
            Across <Figure>{totals.organisations}</Figure> organisations and{" "}
            <Figure>{totals.materialsTracked}</Figure> material families, Circa has mapped{" "}
            <Figure>{totals.matchCount}</Figure> commercial circular opportunities worth{" "}
            <Figure>{formatGBP(totals.totalValue)}</Figure> a year — diverting{" "}
            <Figure>{formatTonnes(totals.diversionTonnes)}</Figure> from landfill and avoiding{" "}
            <Figure>{formatCarbon(totals.carbonTonnes)}</Figure>.{" "}
            <Figure>{totals.readyToProgress}</Figure> are ready to progress now;{" "}
            <span className="text-foreground">{topSector?.sector}</span> leads on sector economics.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-1.5 rounded-md bg-evergreen-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-evergreen-600"
            >
              Explore opportunities <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/matches"
              className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              View pipeline
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-5 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <BigFigure label="Opportunity value / yr" value={formatGBPCompact(totals.totalValue)} movement="+14% vs Q2" accent />
          <BigFigure label="Carbon benefit / yr" value={formatCarbon(totals.carbonTonnes)} movement="+9% vs Q2" />
          <BigFigure label="Ready to progress" value={String(totals.readyToProgress)} movement="+2 vs Q2" />
          <p className="text-2xs text-muted-foreground">Indicative figures; movement shown for the demonstrator.</p>
        </div>
      </section>

      {/* ── Opportunity matrix ────────────────────────────────────────── */}
      <section>
        <SectionTitle
          action={
            <Link href="/opportunities" className="inline-flex items-center gap-1 text-2xs font-medium text-evergreen-600 hover:underline">
              Opportunity landscape <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          Opportunity landscape — value vs readiness
        </SectionTitle>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_250px]">
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <OpportunityMatrix matches={matches} />
          </div>
          <div className="flex flex-col gap-3">
            <QuadrantGuide />
            <div className="rounded-lg border border-border bg-surface/50 p-4">
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Material families
              </p>
              <ul className="flex flex-col gap-1.5">
                {familyLandscape.slice(0, 8).map((f) => (
                  <li key={f.family} className="flex items-center gap-2 text-xs">
                    <FamilyDot color={f.color} />
                    <span className="truncate text-muted-foreground">{f.family}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sector / material / pipeline ──────────────────────────────── */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SectionTitle
            action={
              <Link href="/sectors" className="text-2xs font-medium text-evergreen-600 hover:underline">
                All sectors
              </Link>
            }
          >
            Sector attractiveness
          </SectionTitle>
          <SectorHeatmap rows={sectorRows} />
        </div>

        <div>
          <SectionTitle
            action={
              <Link href="/materials" className="text-2xs font-medium text-evergreen-600 hover:underline">
                Materials
              </Link>
            }
          >
            Material value landscape
          </SectionTitle>
          <ul className="flex flex-col gap-2.5">
            {familyLandscape.map((f) => (
              <li key={f.family}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <FamilyDot color={f.color} />
                    <span className="text-foreground">{f.family}</span>
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{formatGBPCompact(f.value)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${(f.value / maxFamilyValue) * 100}%`, backgroundColor: f.color }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionTitle
            action={
              <Link href="/matches" className="text-2xs font-medium text-evergreen-600 hover:underline">
                Pipeline board
              </Link>
            }
          >
            Opportunity pipeline
          </SectionTitle>
          <ul className="flex flex-col gap-1.5">
            {pipeline.map((p) => (
              <li key={p.stage} className="flex items-center gap-2">
                <span className="w-28 shrink-0 truncate text-2xs text-muted-foreground">{p.stage}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-evergreen-600" style={{ width: `${(p.count / maxPipe) * 100}%` }} />
                </div>
                <span className="w-5 shrink-0 text-right text-2xs font-medium tabular-nums text-foreground">{p.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Opportunities + movements ─────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionTitle>Top emerging opportunities</SectionTitle>
          <ol className="flex flex-col">
            {priority.map((m, i) => (
              <li key={m.id}>
                <Link
                  href={`/opportunities/${m.id}`}
                  className="group flex items-start gap-4 border-b border-border py-3.5 transition-colors hover:bg-surface/50"
                >
                  <span className="mt-0.5 w-5 shrink-0 font-serif text-lg font-semibold text-stone-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <FamilyDot color={FAMILY_FACTORS[m.family].color} />
                      <StageTag stage={m.stage} />
                    </div>
                    <p className="font-medium text-foreground">{m.material}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.supplierName} → {m.buyerName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-base font-semibold tabular-nums text-foreground">
                      {formatGBPCompact(m.value)}
                    </p>
                    <p className="text-2xs text-muted-foreground">readiness {m.strength}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-evergreen-600" />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <SectionTitle>Movements this period</SectionTitle>
            <ul className="flex flex-col divide-y divide-border">
              {movements.map((m) => (
                <li key={m.id}>
                  <Link href={`/opportunities/${m.id}`} className="flex items-start gap-2.5 py-2.5 transition-colors hover:bg-surface/50">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-copper-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{m.material}</p>
                      <p className="text-2xs text-muted-foreground">Reached {m.stage} · {m.buyerName}</p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionTitle>Regional concentration</SectionTitle>
            <HorizontalBars data={regionActivity} color="#b87333" height={200} format="gbpCompact" />
          </div>
        </div>
      </section>
    </div>
  );
}

function Figure({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>;
}

function BigFigure({
  label,
  value,
  movement,
  accent,
}: {
  label: string;
  value: string;
  movement: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2.5">
        <span
          className={`font-serif text-[2rem] font-semibold leading-none tracking-tight tabular-nums ${
            accent ? "text-evergreen-700 dark:text-evergreen-300" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <span className="text-xs font-medium tabular-nums text-evergreen-600">▲ {movement}</span>
      </div>
    </div>
  );
}

function QuadrantGuide() {
  const items = [
    { label: "Act now", note: "High value · high readiness", color: "#185847" },
    { label: "Quick wins", note: "Ready · smaller value", color: "#b87333" },
    { label: "Build the case", note: "High value · early readiness", color: "#4a545d" },
    { label: "Monitor", note: "Lower priority for now", color: "#99a2aa" },
  ];
  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4">
      <p className="mb-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        Reading the matrix
      </p>
      <ul className="flex flex-col gap-2.5">
        {items.map((q) => (
          <li key={q.label} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: q.color }} />
            <div>
              <p className="text-xs font-medium text-foreground">{q.label}</p>
              <p className="text-2xs text-muted-foreground">{q.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
