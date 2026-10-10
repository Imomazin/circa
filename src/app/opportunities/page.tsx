import type { Metadata } from "next";
import { PageHeader, StatTile } from "@/components/primitives";
import { OpportunityExplorer } from "@/components/network/opportunity-explorer";
import { getOpportunities, getNetworkOverview } from "@/server/network";
import { formatGBPCompact, formatCarbon, formatTonnes } from "@/lib/format";

export const metadata: Metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  const matches = getOpportunities();
  const { totals } = getNetworkOverview();

  return (
    <div>
      <PageHeader
        eyebrow="Decision intelligence"
        title="Opportunity discovery"
        description="Every commercial circular-economy opportunity in the network — a supplier material stream matched to a buyer's demand. Filter by material, pipeline stage and match strength to find where to focus."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Opportunities" value={totals.matchCount} accent="evergreen" />
        <StatTile label="Combined value" value={formatGBPCompact(totals.totalValue)} sublabel="Indicative, per year" />
        <StatTile label="Material diverted" value={formatTonnes(totals.diversionTonnes)} sublabel="From landfill / virgin" />
        <StatTile label="Carbon benefit" value={formatCarbon(totals.carbonTonnes)} accent="copper" sublabel="Indicative, per year" />
      </div>

      <OpportunityExplorer matches={matches} />
    </div>
  );
}
