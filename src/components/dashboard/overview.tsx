import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionTitle } from "@/components/primitives";
import { StageTag, StrengthBar, FamilyDot } from "@/components/network/elements";
import { HorizontalBars, type NamedValue } from "@/components/charts";
import { FAMILY_FACTORS } from "@/domain/network/families";
import { formatGBPCompact } from "@/lib/format";
import type { MatchView } from "@/lib/view-types";

export interface OverviewData {
  priority: MatchView[];
  developments: MatchView[];
  pipeline: { stage: string; count: number }[];
  familyValues: NamedValue[];
  sectorViability: NamedValue[];
  regionActivity: NamedValue[];
}

export function Overview({ data }: { data: OverviewData }) {
  const maxPipe = Math.max(...data.pipeline.map((p) => p.count), 1);

  return (
    <div className="flex flex-col gap-7">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Priority opportunities */}
        <div>
          <SectionTitle
            action={
              <Link href="/opportunities" className="inline-flex items-center gap-1 text-2xs font-medium text-evergreen-600 hover:underline">
                All opportunities <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            Opportunities requiring attention
          </SectionTitle>
          <div className="flex flex-col gap-2.5">
            {data.priority.map((m) => (
              <Link
                key={m.id}
                href={`/opportunities/${m.id}`}
                className="group block rounded-lg border border-border bg-card p-4 shadow-card transition-colors hover:border-evergreen-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <FamilyDot color={FAMILY_FACTORS[m.family].color} />
                      <StageTag stage={m.stage} />
                    </div>
                    <p className="font-display text-sm font-semibold tracking-tight text-foreground">
                      {m.material}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {m.supplierName} <span className="text-stone-400">→</span> {m.buyerName}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{m.recommendedAction}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-semibold tabular-nums text-foreground">
                      {formatGBPCompact(m.value)}
                    </p>
                    <div className="mt-1.5 w-28">
                      <StrengthBar value={m.strength} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pipeline + developments */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-5 pt-0">
              {data.pipeline.map((p) => (
                <div key={p.stage} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate text-2xs text-muted-foreground">{p.stage}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-evergreen-600"
                      style={{ width: `${(p.count / maxPipe) * 100}%` }}
                    />
                  </div>
                  <span className="w-5 shrink-0 text-right text-2xs font-medium tabular-nums text-foreground">
                    {p.count}
                  </span>
                </div>
              ))}
              <Link
                href="/matches"
                className="mt-1 inline-flex items-center gap-1 text-2xs font-medium text-evergreen-600 hover:underline"
              >
                Open pipeline board <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent developments</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {data.developments.map((m) => (
                <Link
                  key={m.id}
                  href={`/opportunities/${m.id}`}
                  className="flex items-start gap-2.5 px-5 py-2.5 transition-colors hover:bg-surface"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-copper-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{m.material}</p>
                    <p className="text-2xs text-muted-foreground">
                      Reached <span className="text-foreground">{m.stage}</span> · {m.buyerName}
                    </p>
                  </div>
                  <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-stone-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics strip — three focused reads, not a wall of charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Value by material family</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={data.familyValues} height={240} format="gbpCompact" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>High-potential sectors</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={data.sectorViability} domain={[0, 100]} height={240} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Geographic concentration</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={data.regionActivity} color="#b87333" unit="" height={240} />
          </CardContent>
        </Card>
      </div>

      <p className="text-2xs text-muted-foreground">
        Values are indicative annual figures for the demonstrator; sector potential is the mean
        commercial-viability score (0–100).
      </p>
    </div>
  );
}
