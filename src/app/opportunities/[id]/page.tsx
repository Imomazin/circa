import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Factory, Building2, MapPin, Target, Database } from "lucide-react";
import { PageHeader, SectionTitle, KeyValue, DisclaimerBanner } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StageTag, StrengthBar, FamilyDot, GradeChip, ConstraintList } from "@/components/network/elements";
import { PipelineTracker } from "@/components/network/pipeline-tracker";
import { ScenarioLab, type ScenarioBase } from "@/components/network/scenario-lab";
import { getOpportunity, getOpportunities } from "@/server/network";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { normalisedPosition } from "@/domain/network/geo";
import { CONNECTOR_BY_ID } from "@/integrations/registry";
import { formatGBP, formatGBPCompact, formatTonnes, formatKm, formatCarbon, formatNumber } from "@/lib/format";
import type { StreamView } from "@/lib/view-types";

export function generateStaticParams() {
  return getOpportunities().map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = getOpportunity(id);
  return { title: detail ? `${detail.match.material}` : "Opportunity" };
}

function sourceName(id: string): string {
  if (id === "circa-model") return "CIRCA model";
  return CONNECTOR_BY_ID.get(id)?.name ?? id;
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getOpportunity(id);
  if (!detail) notFound();
  const { match, supply, demand, related } = detail;
  const color = FAMILY_FACTORS[match.family].color;

  const thesis = `${match.supplierName}'s ${supply.material.toLowerCase()} — today ${(supply.currentFate ?? "underused").toLowerCase()} — can meet ${match.buyerName}'s need for ${(demand.specNeeded ?? "circular input").toLowerCase()}. Matched at ${formatTonnes(match.volumeTonnes)} a year, the loop returns ${formatGBPCompact(match.netValue)} net and avoids ${formatCarbon(match.carbonTonnes)}, at a readiness of ${match.strength}/100.`;

  // Distinct data sources that informed this opportunity.
  const sourceIds = Array.from(
    new Set<string>([
      supply.sourceConnector ?? "sap-s4hana",
      demand.sourceConnector ?? "coupa",
      "companies-house",
      "sepa",
      "climatiq",
      "openrouteservice",
    ]),
  );

  const v = Math.max(1, match.volumeTonnes);
  const base: ScenarioBase = {
    volumeTonnes: match.volumeTonnes,
    pricePerTonne: Math.round(match.grossMaterialValue / v),
    disposalPerTonne: Math.round(match.avoidedDisposal / v),
    processingPerTonne: Math.round(match.processingCost / v),
    distanceKm: match.distanceKm,
    freightPerTonneKm: match.distanceKm * v > 0 ? Math.round((match.transportCost / (match.distanceKm * v)) * 100) / 100 : 0.11,
    carbonPerTonne: Math.round(((match.carbonTonnes + match.transportCarbon) / v) * 100) / 100,
    freightCarbonPerTonneKm: 0.00011,
    implementationCost: match.implementationCost,
  };

  return (
    <div>
      <Link href="/opportunities" className="mb-3 inline-flex items-center gap-1.5 text-2xs font-medium text-muted-foreground hover:text-evergreen-600">
        <ArrowLeft className="h-3 w-3" /> Opportunity discovery
      </Link>

      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <FamilyDot color={color} label={match.family} />
            <StageTag stage={match.stage} />
          </div>
          <h1 className="font-serif text-[1.9rem] font-semibold leading-tight tracking-[-0.01em] text-foreground">
            {match.material}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{match.supplierName}</span>
            <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-medium text-foreground">{match.buyerName}</span>
          </p>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">Net annual value</p>
            <p className="font-serif text-[1.9rem] font-semibold leading-none tabular-nums text-evergreen-700 dark:text-evergreen-300">
              {formatGBPCompact(match.netValue)}
            </p>
            <p className="mt-0.5 text-2xs text-muted-foreground">margin {match.marginLowPct}–{match.marginHighPct}%</p>
          </div>
          <div className="w-36">
            <p className="mb-1 text-2xs uppercase tracking-wider text-muted-foreground">Match strength</p>
            <StrengthBar value={match.strength} />
          </div>
        </div>
      </div>

      {/* Data sources */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Database className="h-3.5 w-3.5" /> Sourced from
        </span>
        {sourceIds.map((sid) => (
          <Link key={sid} href="/data-network" className="rounded-[0.3rem] border border-border-strong px-1.5 py-0.5 text-2xs text-muted-foreground transition-colors hover:border-evergreen-400 hover:text-foreground">
            {sourceName(sid)}
          </Link>
        ))}
      </div>

      {/* Recommended action */}
      <div className="mb-7 flex items-start gap-3 rounded-lg border border-evergreen-200 bg-evergreen-50 p-4 dark:border-evergreen-800/50 dark:bg-evergreen-900/20">
        <Target className="mt-0.5 h-4 w-4 shrink-0 text-evergreen-600 dark:text-evergreen-300" />
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-evergreen-700 dark:text-evergreen-300">Recommended next action</p>
          <p className="mt-0.5 text-sm text-foreground">{match.recommendedAction}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-7">
          <div>
            <SectionTitle>Opportunity thesis</SectionTitle>
            <p className="font-serif text-lg leading-relaxed tracking-[-0.005em] text-foreground">{thesis}</p>
          </div>

          <div>
            <SectionTitle>Participating organisations</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PartyCard role="Supplier" icon={Factory} stream={supply} orgId={match.supplierId} confidence={match.supplyConfidence} />
              <PartyCard role="Buyer" icon={Building2} stream={demand} orgId={match.buyerId} confidence={match.demandConfidence} />
            </div>
          </div>

          {/* Economic model */}
          <div>
            <SectionTitle hint="Every figure cites its source">Economic model</SectionTitle>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-strong text-left">
                      <th className="px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Line</th>
                      <th className="px-4 py-2 text-right text-2xs font-semibold uppercase tracking-wider text-muted-foreground">£ / yr</th>
                      <th className="px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
                      <th className="hidden px-4 py-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Assumption</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.economics.map((e, i) => {
                      const isNet = e.label === "Net annual value";
                      const negative = e.value < 0;
                      return (
                        <tr key={i} className={`border-b border-border last:border-0 ${isNet ? "bg-surface/60" : ""}`}>
                          <td className={`px-4 py-2.5 ${isNet ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{e.label}</td>
                          <td className={`px-4 py-2.5 text-right tabular-nums ${isNet ? "font-semibold text-evergreen-700 dark:text-evergreen-300" : negative ? "text-copper-600 dark:text-copper-300" : "text-foreground"}`}>
                            {negative ? "−" : ""}{formatGBP(Math.abs(e.value))}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-2xs text-muted-foreground">{sourceName(e.source)}</span>
                          </td>
                          <td className="hidden px-4 py-2.5 text-2xs text-muted-foreground sm:table-cell">{e.assumption ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Scenario Lab */}
          <div>
            <SectionTitle hint="Flex the drivers; economics update live">Scenario lab</SectionTitle>
            <ScenarioLab base={base} />
          </div>

          <div>
            <SectionTitle>Constraints &amp; risks</SectionTitle>
            <Card>
              <CardContent className="p-5">
                <ConstraintList constraints={match.constraints} />
              </CardContent>
            </Card>
          </div>

          <div>
            <SectionTitle hint="Saved in this browser">Workflow &amp; activity</SectionTitle>
            <Card>
              <CardContent className="p-5">
                <PipelineTracker matchId={match.id} initialStage={match.stage} initialOwner={match.owner} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rail */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>At a glance</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 p-5 pt-0">
              <KeyValue label="Matched volume" value={formatTonnes(match.volumeTonnes)} />
              <KeyValue label="Carbon / yr" value={formatCarbon(match.carbonTonnes)} />
              <KeyValue label="Distance" value={formatKm(match.distanceKm)} />
              <KeyValue label="Implementation" value={formatGBPCompact(match.implementationCost)} />
              <KeyValue label="Supply conf." value={`${match.supplyConfidence}%`} />
              <KeyValue label="Demand conf." value={`${match.demandConfidence}%`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Geographic context</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0">
              <RouteSchematic a={match.supplierRegion} b={match.buyerRegion} color={color} />
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {match.supplierRegion}</span>
                <span className="font-medium tabular-nums text-foreground">{formatKm(match.distanceKm)}</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">{match.buyerRegion} <MapPin className="h-3.5 w-3.5" /></span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Owner</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-sm text-foreground">{match.owner}</p>
              <p className="mt-1 text-2xs text-muted-foreground">Reassign and progress this opportunity in the workflow panel.</p>
            </CardContent>
          </Card>

          {related.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Related in {match.family}</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-1 p-2">
                {related.map((r) => (
                  <Link key={r.id} href={`/opportunities/${r.id}`} className="rounded-md px-3 py-2 transition-colors hover:bg-surface">
                    <p className="truncate text-xs font-medium text-foreground">{r.material}</p>
                    <p className="mt-0.5 flex items-center justify-between text-2xs text-muted-foreground">
                      <span className="truncate">{r.supplierName} → {r.buyerName}</span>
                      <span className="ml-2 shrink-0 font-medium tabular-nums text-foreground">{formatGBPCompact(r.netValue)}</span>
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-8">
        <DisclaimerBanner />
      </div>
    </div>
  );
}

function PartyCard({
  role,
  icon: Icon,
  stream,
  orgId,
  confidence,
}: {
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  stream: StreamView;
  orgId: string;
  confidence: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Icon className="h-3.5 w-3.5" /> {role}
          </span>
          <GradeChip grade={stream.grade ?? stream.minGrade} />
        </div>
        <Link href={`/businesses/${orgId}`} className="font-display text-sm font-semibold tracking-tight text-foreground hover:text-evergreen-600 hover:underline">
          {stream.orgName}
        </Link>
        <p className="mt-0.5 text-2xs text-muted-foreground">{stream.orgSector} · {stream.orgRegion}</p>
        <p className="mt-3 text-sm text-foreground">{stream.material}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {stream.direction === "supply" ? stream.currentFate : stream.specNeeded}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3">
          <KeyValue label="Volume / yr" value={formatTonnes(stream.annualVolumeTonnes)} />
          <KeyValue label="Value / t" value={`£${formatNumber(stream.valuePerTonne)}`} />
          <KeyValue label="Confidence" value={`${confidence}%`} />
        </div>
      </CardContent>
    </Card>
  );
}

function RouteSchematic({ a, b, color }: { a: string; b: string; color: string }) {
  const pa = normalisedPosition(a) ?? { x: 0.3, y: 0.5 };
  const pb = normalisedPosition(b) ?? { x: 0.7, y: 0.5 };
  const W = 280;
  const H = 180;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-md border border-border bg-surface/50" role="img" aria-label={`Route from ${a} to ${b}`}>
      <defs>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="var(--border)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" />
      <line x1={pa.x * W} y1={pa.y * H} x2={pb.x * W} y2={pb.y * H} stroke={color} strokeWidth="1.6" strokeDasharray="4 3" />
      <circle cx={pa.x * W} cy={pa.y * H} r="5" fill={color} />
      <circle cx={pb.x * W} cy={pb.y * H} r="5" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
