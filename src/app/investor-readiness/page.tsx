import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BusinessPicker } from "@/components/business-picker";
import { ScoreBars } from "@/components/charts";
import { StatTile } from "@/components/primitives";
import { getAllBusinessSummaries, summaryToRow } from "@/server/queries";
import { bandDistribution } from "@/lib/analytics";

export const metadata: Metadata = { title: "Investor Readiness" };
export const dynamic = "force-dynamic";

export default async function InvestorReadinessPage() {
  const rows = (await getAllBusinessSummaries()).map(summaryToRow);
  const dist = bandDistribution(rows.map((r) => r.investor)).map((d) => ({ name: d.name, value: d.value }));
  const ready = rows.filter((r) => r.investor >= 65).length;
  const nearly = rows.filter((r) => r.investor >= 50 && r.investor < 65).length;
  const sorted = [...rows].sort((a, b) => b.investor - a.investor);

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Investor readiness"
        description="How close each circular opportunity is to being fundable — evidence, traction, unit economics, capability and a clear capital ask."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Investment-ready" value={ready} accent="evergreen" sublabel="Score ≥ 65" />
          <StatTile label="Approaching" value={nearly} accent="amber" sublabel="Score 50–64" />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Readiness distribution</CardTitle>
            <CardDescription>Businesses per investor-readiness band</CardDescription>
          </CardHeader>
          <CardContent><ScoreBars data={dist} colorByValue={false} height={200} /></CardContent>
        </Card>
      </div>

      <BusinessPicker rows={sorted} basePath="/investor-readiness" metric="investor" />
    </div>
  );
}
