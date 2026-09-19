import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FileText, ArrowLeft } from "lucide-react";
import { PageHeader, DisclaimerBanner, DetailRow } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DimensionCard } from "@/components/dimension-card";
import { RadarScores } from "@/components/charts";
import { RecommendationList } from "@/components/detail-blocks";
import { getBusinessDetail } from "@/server/queries";
import { formatGBP, formatPayback } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  return { title: detail ? `Investor readiness · ${detail.org.name}` : "Investor readiness" };
}

export default async function InvestorReadinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  if (!detail) notFound();
  const { org, assessment, bundle, scenarioSet, recommendations } = detail;
  const investor = bundle.investor;
  const circular = scenarioSet.circular_base;
  const investActions = recommendations.filter((r) => r.category === "Investment" || r.category === "Evidence");
  const radar = investor.components.map((c) => ({ axis: c.label.replace(/ \(.*\)/, ""), value: c.value }));

  return (
    <div>
      <Link href="/investor-readiness" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All businesses
      </Link>
      <PageHeader
        eyebrow={`${org.sector} · ${assessment.circularModels.join(", ")}`}
        title={`Investor readiness — ${org.name}`}
        description="Overall readiness, strengths, gaps and the actions required before approaching funders."
        actions={
          <Link href={`/investor-readiness/${id}/case`}>
            <Button size="sm"><FileText className="h-4 w-4" /> Investment case</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DimensionCard dim={investor} />

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Readiness profile</CardTitle></CardHeader>
            <CardContent><RadarScores data={radar} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Capital & returns</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Capital requirement">{formatGBP(circular.capex)}</DetailRow>
                <DetailRow label="Annual EBITDA uplift">{formatGBP(circular.annualBenefitVsBaseline)}</DetailRow>
                <DetailRow label="Simple payback">{formatPayback(circular.paybackYears)}</DetailRow>
                <DetailRow label="Cash requirement">{formatGBP(circular.cashRequirement)}</DetailRow>
                <DetailRow label="Confidence">{investor.confidence}</DetailRow>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Actions before funding</CardTitle></CardHeader>
          <CardContent><RecommendationList items={investActions} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Evidence gaps</CardTitle></CardHeader>
          <CardContent>
            {investor.missingEvidence.length ? (
              <ul className="flex flex-col gap-1.5">
                {investor.missingEvidence.map((m, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No material evidence gaps identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
