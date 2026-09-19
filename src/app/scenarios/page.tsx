import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives";
import { BusinessPicker } from "@/components/business-picker";
import { getAllBusinessSummaries, summaryToRow } from "@/server/queries";

export const metadata: Metadata = { title: "Scenarios" };
export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const rows = (await getAllBusinessSummaries()).map(summaryToRow);
  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Financial scenario modeller"
        description="Model the commercial impact of a circular opportunity across baseline, circular base, upside and downside cases. Select a business to begin."
      />
      <BusinessPicker rows={rows} basePath="/scenarios" metric="viability" />
    </div>
  );
}
