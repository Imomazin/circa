import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader, DisclaimerBanner } from "@/components/primitives";
import { AssessmentForm } from "@/components/assessment/assessment-form";
import { getBusinessDetail } from "@/server/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  return { title: detail ? `Edit assessment · ${detail.org.name}` : "Edit assessment" };
}

export default async function AssessmentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  if (!detail) notFound();

  return (
    <div>
      <Link href={`/assessments/${id}`} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to assessment
      </Link>
      <PageHeader
        eyebrow="Assessment workflow"
        title={`Edit assessment — ${detail.org.name}`}
        description="Work through the sections. Scores recalculate live; saving persists the inputs and recomputes the stored scores."
      />
      <div className="mb-5">
        <DisclaimerBanner />
      </div>
      <AssessmentForm assessmentId={detail.assessment.id} businessName={detail.org.name} initial={detail.assessment.inputs} />
    </div>
  );
}
