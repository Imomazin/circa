import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SlidersHorizontal, FileText, ClipboardCheck } from "lucide-react";
import { PageHeader, DetailRow, SectionTitle, DisclaimerBanner } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreStrip, DimensionCard } from "@/components/dimension-card";
import { ScoreBadge } from "@/components/score";
import {
  EvidenceTable,
  RecommendationList,
  ResourceTable,
  SupplierTable,
} from "@/components/detail-blocks";
import { getBusinessDetail } from "@/server/queries";
import { formatGBP, formatGBPCompact, formatPct, formatPayback } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  return { title: detail?.org.name ?? "Business" };
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  if (!detail) notFound();

  const { org, assessment, score, bundle, scenarioSet, evidence, recommendations, resourceDependencies, supplierRisks } = detail;
  const base = scenarioSet.baseline;
  const circular = scenarioSet.circular_base;

  return (
    <div>
      <PageHeader
        eyebrow={`${org.sector} · ${org.region}`}
        title={org.name}
        description={org.description}
        actions={
          <>
            <Link href={`/assessments/${assessment.id}/edit`}>
              <Button variant="outline" size="sm"><ClipboardCheck className="h-4 w-4" /> Edit assessment</Button>
            </Link>
            <Link href={`/scenarios/${assessment.id}`}>
              <Button variant="outline" size="sm"><SlidersHorizontal className="h-4 w-4" /> Scenarios</Button>
            </Link>
            <Link href={`/investor-readiness/${assessment.id}/case`}>
              <Button size="sm"><FileText className="h-4 w-4" /> Investment case</Button>
            </Link>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {assessment.circularModels.map((m) => (
          <Badge key={m} variant="evergreen">{m}</Badge>
        ))}
        <Badge variant="outline">{assessment.stage}</Badge>
        <Badge variant="outline">{org.companySize}</Badge>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          Headline <ScoreBadge score={score.headline} />
        </span>
      </div>

      <div className="mb-6">
        <ScoreStrip
          scores={[
            { label: "Commercial Viability", value: bundle.viability.score },
            { label: "Commercial Resilience", value: bundle.resilience.score },
            { label: "Investor Readiness", value: bundle.investor.score },
            { label: "Circular Opportunity", value: bundle.opportunity.score },
            { label: "Evidence Confidence", value: bundle.evidence.score },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: business profile */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Business overview</CardTitle></CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Sector">{org.sector}</DetailRow>
                <DetailRow label="Company size">{org.companySize}</DetailRow>
                <DetailRow label="Region">{org.region}</DetailRow>
                <DetailRow label="Current operating model">{org.currentOperatingModel}</DetailRow>
                <DetailRow label="Current revenue model">{org.currentRevenueModel}</DetailRow>
                <DetailRow label="Products / services">{org.productsServices}</DetailRow>
                <DetailRow label="Customer model">{org.customerModel}</DetailRow>
                <DetailRow label="Commercial pressures">{org.commercialPressures}</DetailRow>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Circular opportunity</CardTitle>
              <CardDescription>{assessment.opportunitySummary}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{assessment.commercialRationale}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Resource dependencies</CardTitle></CardHeader>
              <CardContent className="p-0"><ResourceTable items={resourceDependencies} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Major suppliers</CardTitle></CardHeader>
              <CardContent className="p-0"><SupplierTable items={supplierRisks} /></CardContent>
            </Card>
          </div>

          <DimensionCard dim={bundle.viability} />
          <DimensionCard dim={bundle.resilience} />
        </div>

        {/* Right: financial + evidence + recommendations */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial summary</CardTitle>
              <CardDescription>Baseline vs circular base case (annual)</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="text-sm">
                <FinRow label="Revenue" base={base.revenue} circular={circular.revenue} money />
                <FinRow label="Gross margin" base={base.grossMarginPct} circular={circular.grossMarginPct} pct />
                <FinRow label="EBITDA" base={base.ebitda} circular={circular.ebitda} money />
                <FinRow label="Recurring revenue" base={base.recurringRevenue} circular={circular.recurringRevenue} money />
                <div className="mt-2 border-t border-border pt-2">
                  <DetailRow label="Capital requirement">{formatGBP(circular.capex)}</DetailRow>
                  <DetailRow label="Annual EBITDA uplift">{formatGBP(circular.annualBenefitVsBaseline)}</DetailRow>
                  <DetailRow label="Simple payback">{formatPayback(circular.paybackYears)}</DetailRow>
                  <DetailRow label="Cash requirement">{formatGBP(circular.cashRequirement)}</DetailRow>
                </div>
              </dl>
              <Link href={`/scenarios/${assessment.id}`} className="mt-3 inline-flex text-xs font-medium text-evergreen-600 hover:underline">
                Open scenario modeller →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
            <CardContent><RecommendationList items={recommendations} /></CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle hint={`${evidence.length} items`}>Evidence summary</SectionTitle>
        <Card>
          <CardContent className="p-0"><EvidenceTable items={evidence} /></CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  );
}

function FinRow({
  label,
  base,
  circular,
  money,
  pct,
}: {
  label: string;
  base: number;
  circular: number;
  money?: boolean;
  pct?: boolean;
}) {
  const fmt = (n: number) => (money ? formatGBPCompact(n) : pct ? formatPct(n) : String(n));
  const delta = circular - base;
  const up = delta >= 0;
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 tabular-nums">
        <span className="text-muted-foreground">{fmt(base)}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-medium text-foreground">{fmt(circular)}</span>
        <span className={`text-2xs ${up ? "text-evergreen-600" : "text-red-500"}`}>
          {up ? "▲" : "▼"} {money ? formatGBPCompact(Math.abs(delta)) : pct ? formatPct(Math.abs(delta)) : Math.abs(delta)}
        </span>
      </span>
    </div>
  );
}
