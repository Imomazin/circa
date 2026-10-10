import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { PageHeader, StatTile, SectionTitle } from "@/components/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FamilyDot, GradeChip } from "@/components/network/elements";
import { MaterialFlow } from "@/components/intelligence/material-flow";
import { getMaterials } from "@/server/network";
import { formatGBPCompact, formatTonnes, formatCarbon, formatNumber } from "@/lib/format";
import type { MaterialFamilyView } from "@/server/network";
import type { StreamView } from "@/lib/view-types";

export const metadata: Metadata = { title: "Materials" };

export default function MaterialsPage() {
  const { families, unmatched } = getMaterials();
  const totalSupply = families.reduce((n, f) => n + f.supplyTonnes, 0);
  const totalDemand = families.reduce((n, f) => n + f.demandTonnes, 0);
  const totalMatched = families.reduce((n, f) => n + f.matchedTonnes, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Decision intelligence"
        title="Material intelligence"
        description="What is flowing through the network: the materials available, who supplies and who needs them, the volumes and value in play, and where supply has no home yet."
      />

      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Material families" value={families.length} accent="evergreen" />
        <StatTile label="Supply tracked" value={formatTonnes(totalSupply)} sublabel="Available per year" />
        <StatTile label="Demand tracked" value={formatTonnes(totalDemand)} sublabel="Sought per year" />
        <StatTile
          label="Matched"
          value={formatTonnes(totalMatched)}
          accent="copper"
          sublabel={`${Math.round((totalMatched / totalSupply) * 100)}% of supply`}
        />
      </div>

      <div className="mb-8">
        <SectionTitle>Material flow</SectionTitle>
        <div className="rounded-lg border border-border bg-card p-5 shadow-card">
          <MaterialFlow
            rows={families.map((f) => ({
              family: f.family,
              color: f.color,
              matchedTonnes: f.matchedTonnes,
              supplyTonnes: f.supplyTonnes,
              demandTonnes: f.demandTonnes,
            }))}
          />
          <p className="mt-2 text-2xs text-muted-foreground">
            Ribbon thickness is proportional to matched volume moving from recovered supply into
            circular demand, per material family.
          </p>
        </div>
      </div>

      <SectionTitle hint={`${families.length} families`}>Material families</SectionTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {families.map((f) => (
          <FamilyCard key={f.family} family={f} />
        ))}
      </div>

      {unmatched.length > 0 && (
        <div className="mt-8">
          <SectionTitle hint="Supply with no buyer in the network yet">Surfaced gaps</SectionTitle>
          <Card>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {unmatched.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-copper-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.material}</p>
                      <p className="text-2xs text-muted-foreground">
                        {s.orgName} · {s.orgRegion} · currently: {s.currentFate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="tabular-nums text-muted-foreground">{formatTonnes(s.annualVolumeTonnes)}</span>
                    <Badge variant="copper">Originate demand</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <p className="mt-2 text-2xs text-muted-foreground">
            These streams are available but have no matching buyer in the current network — a target for
            demand-side origination.
          </p>
        </div>
      )}
    </div>
  );
}

function FamilyCard({ family: f }: { family: MaterialFamilyView }) {
  const max = Math.max(f.supplyTonnes, f.demandTonnes, 1);
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FamilyDot color={f.color} />
            <h3 className="font-display text-sm font-semibold tracking-tight text-foreground">{f.family}</h3>
          </div>
          <div className="text-right">
            <p className="font-display text-base font-semibold tabular-nums text-foreground">
              {formatGBPCompact(f.value)}
            </p>
            <p className="text-2xs text-muted-foreground">{f.matchCount} match{f.matchCount === 1 ? "" : "es"}</p>
          </div>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.note}</p>

        {/* Supply / demand balance */}
        <div className="mt-4 flex flex-col gap-2">
          <BalanceBar label="Supply" value={f.supplyTonnes} max={max} color={f.color} />
          <BalanceBar label="Demand" value={f.demandTonnes} max={max} color="var(--border-strong)" dark />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-2xs text-muted-foreground">
          <span>
            Carbon potential <span className="font-medium text-foreground">{formatCarbon(f.carbonTonnes)}</span>
          </span>
          <span>
            Avoided disposal{" "}
            <span className="font-medium text-foreground">£{formatNumber(f.disposalPerTonne)}/t</span>
          </span>
        </div>

        {/* Participants */}
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <ParticipantList title="Suppliers" streams={f.suppliers} />
          <ParticipantList title="Buyers" streams={f.buyers} />
        </div>

        {f.matches.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
              Opportunities
            </p>
            <div className="flex flex-col gap-1">
              {f.matches.slice(0, 3).map((m) => (
                <Link
                  key={m.id}
                  href={`/opportunities/${m.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-surface"
                >
                  <span className="truncate text-muted-foreground">
                    {m.supplierName} → {m.buyerName}
                  </span>
                  <span className="ml-2 inline-flex shrink-0 items-center gap-1.5 font-medium tabular-nums text-foreground">
                    {formatGBPCompact(m.value)} <ArrowRight className="h-3 w-3 text-stone-400" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BalanceBar({
  label,
  value,
  max,
  color,
  dark,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-2xs text-muted-foreground">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-[3px] bg-surface-2">
        <div
          className="h-full rounded-[3px]"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color, opacity: dark ? 0.55 : 1 }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-2xs font-medium tabular-nums text-foreground">
        {formatTonnes(value)}
      </span>
    </div>
  );
}

function ParticipantList({ title, streams }: { title: string; streams: StreamView[] }) {
  return (
    <div>
      <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      {streams.length === 0 ? (
        <p className="text-2xs text-stone-400">None in network</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {streams.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <GradeChip grade={s.grade ?? s.minGrade} />
              <Link
                href={`/businesses/${s.orgId}`}
                className="min-w-0 flex-1 truncate text-xs text-foreground hover:text-evergreen-600 hover:underline"
                title={s.orgName}
              >
                {s.orgName}
              </Link>
              <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                {formatTonnes(s.annualVolumeTonnes)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
