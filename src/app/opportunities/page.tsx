import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score";
import { DonutChart } from "@/components/charts";
import { formatGBPCompact } from "@/lib/format";
import { getAllBusinessSummaries } from "@/server/queries";

export const metadata: Metadata = { title: "Opportunities" };
export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const summaries = await getAllBusinessSummaries();
  const modelDist = (() => {
    const m = new Map<string, number>();
    for (const s of summaries) for (const model of s.assessment.circularModels) m.set(model, (m.get(model) ?? 0) + 1);
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Circular opportunities"
        description="Every circular business opportunity in the portfolio, ranked by circular-opportunity strength alongside its commercial viability and capital need."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Opportunity pipeline</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {summaries
              .slice()
              .sort((a, b) => b.score.opportunity - a.score.opportunity)
              .map(({ org, assessment, score }) => (
                <Link
                  key={org.id}
                  href={`/businesses/${org.id}`}
                  className="block rounded-lg border border-border p-3 transition-colors hover:border-evergreen-300 hover:bg-charcoal-50/50 dark:hover:bg-charcoal-800/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{org.name}</p>
                      <p className="text-2xs text-muted-foreground">{org.sector} · {org.region}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {assessment.circularModels.map((m) => (
                        <Badge key={m} variant="evergreen">{m}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{assessment.opportunitySummary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Opportunity <span className="font-medium text-foreground">{score.opportunity.toFixed(1)}</span></span>
                    <span>Viability <span className="font-medium text-foreground">{score.viability.toFixed(1)}</span></span>
                    <span>Capital <span className="font-medium text-foreground">{formatGBPCompact(assessment.inputs.capexRequirement)}</span></span>
                    <span className="ml-auto"><ScoreBadge score={score.opportunity} /></span>
                  </div>
                </Link>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Circular models in play</CardTitle></CardHeader>
          <CardContent><DonutChart data={modelDist} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
