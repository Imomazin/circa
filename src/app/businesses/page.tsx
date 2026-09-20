import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives";
import { BusinessDirectory } from "@/components/businesses/directory";
import { getAllBusinessSummaries, summaryToRow } from "@/server/queries";

export const metadata: Metadata = { title: "Businesses" };
export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const summaries = await getAllBusinessSummaries();
  const rows = summaries.map(summaryToRow);

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Business directory"
        description="Synthetic Scottish businesses exploring circular opportunities. Search, filter and sort by commercial standing, then open a profile for the full assessment."
      />
      <BusinessDirectory rows={rows} />
    </div>
  );
}
