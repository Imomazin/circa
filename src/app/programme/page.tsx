import type { Metadata } from "next";
import { PageHeader, StatTile, DisclaimerBanner } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBars, HorizontalBars, DonutChart } from "@/components/charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllBusinessSummaries, getSectorBenchmarks, getProgrammeInsights } from "@/server/queries";
import { bandDistribution } from "@/lib/analytics";
import { formatGBPCompact } from "@/lib/format";

export const metadata: Metadata = { title: "Programme Intelligence" };
export const dynamic = "force-dynamic";

export default async function ProgrammePage() {
  const [summaries, benchmarks, insights] = await Promise.all([
    getAllBusinessSummaries(),
    getSectorBenchmarks(),
    getProgrammeInsights(),
  ]);

  const viabilityDist = bandDistribution(summaries.map((s) => s.score.viability)).map((d) => ({ name: d.name, value: d.value }));
  const investorDist = bandDistribution(summaries.map((s) => s.score.investor)).map((d) => ({ name: d.name, value: d.value }));

  const modelAdoption = (() => {
    const m = new Map<string, number>();
    for (const s of summaries) for (const model of s.assessment.circularModels) m.set(model, (m.get(model) ?? 0) + 1);
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  const capexBySector = benchmarks
    .map((b) => ({ name: b.sector, value: Math.round(b.avgCapexRequirement) }))
    .sort((a, b) => b.value - a.value);

  const barriers = (() => {
    const m = new Map<string, number>();
    for (const s of summaries)
      for (const d of s.bundle.viability.negativeDrivers) {
        const k = d.replace(/\s*\(\d+\)$/, "").replace(/\s*\(inverted\)/, "");
        m.set(k, (m.get(k) ?? 0) + 1);
      }
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  })();

  const evidenceGaps = summaries.filter((s) => s.score.evidence < 55).length;
  const findInsight = (metric: string) => insights.find((i) => i.metric === metric);

  return (
    <div>
      <PageHeader
        eyebrow="Zero Waste Scotland-style programme view"
        title="Programme intelligence"
        description="An anonymised, aggregate view for policy and programme teams — where the commercial value sits, what capital it needs, and where support would move the needle. No business-level data is exposed here."
      />
      <div className="mb-5"><DisclaimerBanner /></div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {insights.map((i) => (
          <StatTile
            key={i.id}
            label={i.metric}
            value={i.unit === "GBP" ? formatGBPCompact(i.value) : i.value}
            sublabel={i.category}
            accent={i.category === "Capital" || i.category === "Support" ? "amber" : "evergreen"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commercial viability distribution</CardTitle>
            <CardDescription>Businesses per band across the cohort</CardDescription>
          </CardHeader>
          <CardContent><ScoreBars data={viabilityDist} colorByValue={false} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Investor readiness distribution</CardTitle>
            <CardDescription>Where the cohort sits on fundability</CardDescription>
          </CardHeader>
          <CardContent><ScoreBars data={investorDist} colorByValue={false} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Business-model adoption</CardTitle>
            <CardDescription>Circular models being pursued</CardDescription>
          </CardHeader>
          <CardContent><DonutChart data={modelAdoption} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Capital requirement by sector</CardTitle>
            <CardDescription>Average prototype capex, £</CardDescription>
          </CardHeader>
          <CardContent><HorizontalBars data={capexBySector} color="#c98a2b" /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Common commercial barriers</CardTitle>
            <CardDescription>Most frequent weak viability components</CardDescription>
          </CardHeader>
          <CardContent><HorizontalBars data={barriers} color="#b4472f" /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Support requirements</CardTitle>
            <CardDescription>Where programme support would help most</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SupportRow label="Businesses needing adviser support" value={findInsight("Businesses needing adviser support")?.value ?? 0} note="Strong viability, low evidence" />
            <SupportRow label="Evidence-gap businesses" value={evidenceGaps} note="Evidence confidence below 55" />
            <SupportRow label="Capital-intensive opportunities" value={summaries.filter((s) => s.assessment.inputs.capexRequirement >= 1_000_000).length} note="Capex ≥ £1m" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Sector benchmarks</CardTitle>
            <CardDescription>Average commercial standing and capital need by sector</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Viability</TableHead>
                  <TableHead className="text-right">Resilience</TableHead>
                  <TableHead className="text-right">Investor</TableHead>
                  <TableHead className="text-right">Avg capex</TableHead>
                  <TableHead>Common model</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium text-foreground">{b.sector}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.avgViability.toFixed(1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.avgResilience.toFixed(1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.avgInvestor.toFixed(1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatGBPCompact(b.avgCapexRequirement)}</TableCell>
                    <TableCell><Badge variant="outline">{b.commonModel}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SupportRow({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-2xs text-muted-foreground">{note}</p>
      </div>
      <span className="text-xl font-semibold tabular-nums text-evergreen-600">{value}</span>
    </div>
  );
}
