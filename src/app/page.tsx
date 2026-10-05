import { PageHeader, DisclaimerBanner } from "@/components/primitives";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getAllBusinessSummaries, summaryToRow } from "@/server/queries";
import { getDemoDashboardRows } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  let rows;

  if (!process.env.DATABASE_URL) {
    rows = getDemoDashboardRows();
  } else {
    try {
      const summaries = await getAllBusinessSummaries();
      rows = summaries.map(summaryToRow);
    } catch (error) {
      console.error("[circa] Database unavailable, using deterministic demo data.", error);
      rows = getDemoDashboardRows();
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Executive overview"
        title="Commercial intelligence for circular opportunities"
        description="Does this circular business opportunity make commercial sense? Circa scores viability, resilience and investor readiness across the portfolio, with the evidence behind each judgement."
      />
      <div className="mb-5">
        <DisclaimerBanner />
      </div>
      <Dashboard rows={rows} />
    </div>
  );
}