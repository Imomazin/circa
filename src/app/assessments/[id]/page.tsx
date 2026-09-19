import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { PageHeader, DisclaimerBanner, DetailRow } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreStrip, DimensionCard } from "@/components/dimension-card";
import { RecalcButton } from "@/components/recalc-button";
import { getBusinessDetail } from "@/server/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  return { title: detail ? `Assessment · ${detail.org.name}` : "Assessment" };
}

export default async function AssessmentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  if (!detail) notFound();
  const { org, assessment, bundle, score } = detail;

  return (
    <div>
      <PageHeader
        eyebrow={`Assessment · ${org.sector}`}
        title={org.name}
        description={assessment.opportunitySummary}
        actions={
          <>
            <RecalcButton assessmentId={assessment.id} />
            <Link href={`/assessments/${assessment.id}/edit`}>
              <Button size="sm"><Pencil className="h-4 w-4" /> Edit assessment</Button>
            </Link>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {assessment.circularModels.map((m) => (
          <Badge key={m} variant="evergreen">{m}</Badge>
        ))}
        <Badge variant="outline">{assessment.stage}</Badge>
        <span className="text-2xs text-muted-foreground">Scores recalculated {formatDate(score.calculatedAt)}</span>
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

      <Card className="mb-6">
        <CardHeader><CardTitle>Assessment summary</CardTitle></CardHeader>
        <CardContent>
          <dl>
            <DetailRow label="Circular models">{assessment.circularModels.join(", ")}</DetailRow>
            <DetailRow label="Opportunity">{assessment.opportunitySummary}</DetailRow>
            <DetailRow label="Commercial rationale">{assessment.commercialRationale}</DetailRow>
            <DetailRow label="Stage">{assessment.stage}</DetailRow>
          </dl>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DimensionCard dim={bundle.viability} />
        <DimensionCard dim={bundle.resilience} />
        <DimensionCard dim={bundle.investor} />
        <DimensionCard dim={bundle.opportunity} />
        <DimensionCard dim={bundle.evidence} />
      </div>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
