import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/primitives";
import { NewBusinessWizard } from "@/components/business/new-wizard";

export const metadata: Metadata = { title: "New business" };

export default function NewBusinessPage() {
  return (
    <div>
      <Link
        href="/businesses"
        className="mb-3 inline-flex items-center gap-1.5 text-2xs font-medium text-muted-foreground hover:text-evergreen-600"
      >
        <ArrowLeft className="h-3 w-3" /> Back to directory
      </Link>
      <PageHeader
        eyebrow="Workspace"
        title="Add a business"
        description="Capture a business, describe its circular opportunity and set its financial baseline. Circa derives the five scores, four financial scenarios and recommendation set from the same transparent engine used across the demonstrator — nothing is invented."
      />
      <NewBusinessWizard />
    </div>
  );
}
