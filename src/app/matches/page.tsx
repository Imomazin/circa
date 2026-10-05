import type { Metadata } from "next";
import { PageHeader, StatTile } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineBoard } from "@/components/network/pipeline-board";
import { getOpportunities, getNetworkOverview } from "@/server/network";
import { formatGBPCompact } from "@/lib/format";

export const metadata: Metadata = { title: "Matching & pipeline" };

export default function MatchesPage() {
  const matches = getOpportunities();
  const { totals, pipeline } = getNetworkOverview();
  const maxCount = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Decision intelligence"
        title="Matching &amp; pipeline"
        description="How circular opportunities progress — from a material match identified to a loop realised. Track the portfolio across the nine-stage pipeline and focus the opportunities ready to move."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="In pipeline" value={totals.matchCount} accent="evergreen" />
        <StatTile label="Ready to progress" value={totals.readyToProgress} accent="copper" sublabel="Pilot and beyond" />
        <StatTile label="Pipeline value" value={formatGBPCompact(totals.totalValue)} sublabel="Indicative, per year" />
        <StatTile label="Organisations" value={totals.organisations} sublabel="Participating in matches" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pipeline funnel</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex items-end gap-1.5">
            {pipeline.map((p) => (
              <div key={p.stage} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-semibold tabular-nums text-foreground">{p.count}</span>
                <div
                  className="w-full rounded-t-sm bg-evergreen-600"
                  style={{ height: `${8 + (p.count / maxCount) * 72}px`, opacity: 0.55 + 0.45 * (p.count / maxCount) }}
                  title={`${p.stage}: ${p.count} · ${formatGBPCompact(p.value)}`}
                />
                <span className="text-center text-[0.5625rem] leading-tight text-muted-foreground">
                  {p.stage}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PipelineBoard matches={matches} />
    </div>
  );
}
