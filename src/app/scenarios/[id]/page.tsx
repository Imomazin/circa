import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader, DisclaimerBanner } from "@/components/primitives";
import { ScenarioModeller } from "@/components/scenarios/modeller";
import { getBusinessDetail } from "@/server/queries";
import type { ScenarioType } from "@/domain/constants";
import type { ScenarioAssumptions } from "@/domain/scenarios/model";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  return { title: detail ? `Scenarios · ${detail.org.name}` : "Scenarios" };
}

export default async function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  if (!detail) notFound();

  const initial = Object.fromEntries(
    detail.scenarios.map((s) => [s.type, s.assumptions]),
  ) as Record<ScenarioType, ScenarioAssumptions>;

  return (
    <div>
      <Link href={`/businesses/${id}`} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {detail.org.name}
      </Link>
      <PageHeader
        eyebrow={`${detail.org.sector} · ${detail.assessment.circularModels.join(", ")}`}
        title={`Scenario modeller — ${detail.org.name}`}
        description={detail.assessment.opportunitySummary}
      />
      <div className="mb-5">
        <DisclaimerBanner />
      </div>
      <ScenarioModeller assessmentId={detail.assessment.id} baseline={detail.assessment.baseline} initial={initial} />
    </div>
  );
}
