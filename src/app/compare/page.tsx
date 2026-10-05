import type { Metadata } from "next";
import { PageHeader, EmptyState } from "@/components/primitives";
import { CompareBoard } from "@/components/businesses/compare-board";
import { getAllBusinessSummaries, summaryToRow } from "@/server/queries";

export const metadata: Metadata = { title: "Compare" };
export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const rows = (await getAllBusinessSummaries()).map(summaryToRow);

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        title="Compare businesses"
        description="Put circular opportunities side by side across the five commercial dimensions, their capital requirement and projected annual opportunity — a quick read on where to focus investment and support."
      />
      {rows.length === 0 ? (
        <EmptyState title="No businesses to compare" description="Seed the demonstrator data or add a business first." />
      ) : (
        <CompareBoard rows={rows} />
      )}
    </div>
  );
}
