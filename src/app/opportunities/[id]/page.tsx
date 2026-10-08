import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Factory, Building2, MapPin, Target } from "lucide-react";
import { PageHeader, SectionTitle, KeyValue, DisclaimerBanner } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageTag, StrengthBar, FamilyDot, GradeChip, ConstraintList } from "@/components/network/elements";
import { PipelineTracker } from "@/components/network/pipeline-tracker";
import { getOpportunity, getOpportunities } from "@/server/network";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { normalisedPosition } from "@/domain/network/geo";
import {
  formatGBP,
  formatGBPCompact,
  formatTonnes,
  formatKm,
  formatCarbon,
  formatNumber,
} from "@/lib/format";
import type { StreamView } from "@/lib/view-types";

export function generateStaticParams() {
  return getOpportunities().map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = getOpportunity(id);
  return { title: detail ? `${detail.match.material}` : "Opportunity" };
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getOpportunity(id);
  if (!detail) notFound();
  const { match, supply, demand, familyNote, related } = detail;
  const color = FAMILY_FACTORS[match.family].color;

  // Opportunity thesis — a plain-language investment framing.
  const thesis = `${match.supplierName}'s ${supply.material.toLowerCase()} — today ${(supply.currentFate ?? "underused").toLowerCase()} — can meet ${match.buyerName}'s need for ${(demand.specNeeded ?? "circular input").toLowerCase()}. Matched at ${formatTonnes(match.volumeTonnes)} a year, the loop is worth ${formatGBPCompact(match.value)} and avoids ${formatCarbon(match.carbonTonnes)}, at a readiness of ${match.strength}/100.`;

  // Scenario sensitivity — how the economics move under four planning cases.
  const scenarios = [
    { label: "Conservative", vol: 0.7, price: 0.9 },
    { label: "Baseline", vol: 1, price: 1 },
    { label: "Target", vol: 1.1, price: 1.05 },
    { label: "Accelerated", vol: 1.3, price: 1.12 },
  ].map((s) => ({
    label: s.label,
    value: Math.round(match.value * s.vol * s.price),
    carbon: Math.round(match.carbonTonnes * s.vol),
  }));
  const maxScenario = Math.max(...scenarios.map((s) => s.value));

  return (
    <div>
      <Link
        href="/opportunities"
        className="mb-3 inline-flex items-center gap-1.5 text-2xs font-medium text-muted-foreground hover:text-evergreen-600"
      >
        <ArrowLeft className="h-3 w-3" /> Opportunity discovery
      </Link>

      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <FamilyDot color={color} label={match.family} />
            <StageTag stage={match.stage} />
          </div>
          <h1 className="font-display text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground">
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
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">Annual value</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
              {formatGBPCompact(match.value)}
            </p>
          </div>
          <div className="w-36">
            <p className="mb-1 text-2xs uppercase tracking-wider text-muted-foreground">Match strength</p>
            <StrengthBar value={match.strength} />
          </div>
        </div>
      </div>

      {/* Recommended action */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-evergreen-200 bg-evergreen-50 p-4 dark:border-evergreen-800/50 dark:bg-evergreen-900/20">
        <Target className="mt-0.5 h-4 w-4 shrink-0 text-evergreen-600 dark:text-evergreen-300" />
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-evergreen-700 dark:text-evergreen-300">
            Recommended next action
          </p>
          <p className="mt-0.5 text-sm text-foreground">{match.recommendedAction}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {/* Thesis */}
          <div>
            <SectionTitle>Opportunity thesis</SectionTitle>
            <p className="font-serif text-lg leading-relaxed tracking-[-0.005em] text-foreground">{thesis}</p>
          </div>

          {/* Participating organisations */}
          <div>
            <SectionTitle>Participating organisations</SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PartyCard role="Supplier" icon={Factory} stream={supply} orgId={match.supplierId} />
              <PartyCard role="Buyer" icon={Building2} stream={demand} orgId={match.buyerId} />
            </div>
          </div>

          {/* Commercial & impact */}
          <div>
            <SectionTitle hint={familyNote}>Commercial &amp; impact</SectionTitle>
            <Card>
              <CardContent className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3">
                <KeyValue label="Commercial value / yr" value={formatGBP(match.value)} />
                <KeyValue label="Avoided disposal / yr" value={formatGBP(match.avoidedDisposal)} />
                <KeyValue label="Matched volume" value={formatTonnes(match.volumeTonnes)} />
                <KeyValue label="Carbon benefit / yr" value={formatCarbon(match.carbonTonnes)} />
                <KeyValue label="Material diverted" value={formatTonnes(match.diversionTonnes)} />
                <KeyValue label="Haulage distance" value={formatKm(match.distanceKm)} />
              </CardContent>
            </Card>
          </div>

          {/* Scenario sensitivity */}
          <div>
            <SectionTitle hint="Volume × price planning cases">Scenario sensitivity</SectionTitle>
            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                {scenarios.map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{s.label}</span>
                    <div className="h-6 flex-1 overflow-hidden rounded bg-surface-2">
                      <div
                        className={`flex h-full items-center justify-end rounded px-2 ${s.label === "Baseline" ? "bg-evergreen-700" : "bg-evergreen-500"}`}
                        style={{ width: `${Math.max(16, (s.value / maxScenario) * 100)}%` }}
                      >
                        <span className="text-2xs font-semibold text-white">{formatGBPCompact(s.value)}</span>
                      </div>
                    </div>
                    <span className="w-20 shrink-0 text-right text-2xs tabular-nums text-muted-foreground">
                      {formatCarbon(s.carbon)}
                    </span>
                  </div>
                ))}
                <p className="text-2xs text-muted-foreground">
                  Illustrative: cases flex matched volume and realised price around the baseline match.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Constraints */}
          <div>
            <SectionTitle>Constraints &amp; risks</SectionTitle>
            <Card>
              <CardContent className="p-5">
                <ConstraintList constraints={match.constraints} />
              </CardContent>
            </Card>
          </div>

          {/* Workflow */}
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
            <CardHeader>
              <CardTitle>Geographic context</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <RouteSchematic
                a={{ region: match.supplierRegion }}
                b={{ region: match.buyerRegion }}
                color={color}
              />
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {match.supplierRegion}
                </span>
                <span className="font-medium tabular-nums text-foreground">{formatKm(match.distanceKm)}</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  {match.buyerRegion} <MapPin className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Owner</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-sm text-foreground">{match.owner}</p>
              <p className="mt-1 text-2xs text-muted-foreground">
                Reassign and progress this opportunity in the workflow panel.
              </p>
            </CardContent>
          </Card>

          {related.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related in {match.family}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 p-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/opportunities/${r.id}`}
                    className="rounded-md px-3 py-2 transition-colors hover:bg-surface"
                  >
                    <p className="truncate text-xs font-medium text-foreground">{r.material}</p>
                    <p className="mt-0.5 flex items-center justify-between text-2xs text-muted-foreground">
                      <span className="truncate">{r.supplierName} → {r.buyerName}</span>
                      <span className="ml-2 shrink-0 font-medium tabular-nums text-foreground">
                        {formatGBPCompact(r.value)}
                      </span>
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
}: {
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  stream: StreamView;
  orgId: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Icon className="h-3.5 w-3.5" /> {role}
          </span>
          {stream.grade ? <GradeChip grade={stream.grade} /> : <GradeChip grade={stream.minGrade} />}
        </div>
        <Link
          href={`/businesses/${orgId}`}
          className="font-display text-sm font-semibold tracking-tight text-foreground hover:text-evergreen-600 hover:underline"
        >
          {stream.orgName}
        </Link>
        <p className="mt-0.5 text-2xs text-muted-foreground">
          {stream.orgSector} · {stream.orgRegion}
        </p>
        <p className="mt-3 text-sm text-foreground">{stream.material}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {stream.direction === "supply" ? stream.currentFate : stream.specNeeded}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
          <KeyValue label="Volume / yr" value={formatTonnes(stream.annualVolumeTonnes)} />
          <KeyValue label="Value / t" value={`£${formatNumber(stream.valuePerTonne)}`} />
        </div>
      </CardContent>
    </Card>
  );
}

/** Lightweight schematic of the two sites on a stylised Scotland bounding box. */
function RouteSchematic({
  a,
  b,
  color,
}: {
  a: { region: string };
  b: { region: string };
  color: string;
}) {
  const pa = normalisedPosition(a.region) ?? { x: 0.3, y: 0.5 };
  const pb = normalisedPosition(b.region) ?? { x: 0.7, y: 0.5 };
  const W = 280;
  const H = 180;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-md border border-border bg-surface/50" role="img" aria-label={`Route from ${a.region} to ${b.region}`}>
      <defs>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="var(--border)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" />
      <line
        x1={pa.x * W}
        y1={pa.y * H}
        x2={pb.x * W}
        y2={pb.y * H}
        stroke={color}
        strokeWidth="1.6"
        strokeDasharray="4 3"
      />
      <circle cx={pa.x * W} cy={pa.y * H} r="5" fill={color} />
      <circle cx={pb.x * W} cy={pb.y * H} r="5" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
