import { PageHeader, DisclaimerBanner } from "@/components/primitives";
import { Dashboard } from "@/components/dashboard/dashboard";
import { getAllBusinessSummaries, summaryToRow } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const summaries = await getAllBusinessSummaries();
  const rows = summaries.map(summaryToRow);

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
