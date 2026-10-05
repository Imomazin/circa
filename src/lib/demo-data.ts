import { BUSINESSES } from "@/db/seed-data";
import { computeScores, headlineScore } from "@/domain/scoring";
import { bandForScore, confidenceForScore } from "@/domain/constants";
import type { DashboardRow } from "@/lib/view-types";

const DEMO_DATE = "2026-09-01T09:00:00.000Z";

export function getDemoDashboardRows(): DashboardRow[] {
  return BUSINESSES.map((business) => {
    const bundle = computeScores(business.inputs, DEMO_DATE);
    const viability = bundle.viability.score;
    const investor = bundle.investor.score;
    const evidence = bundle.evidence.score;

    return {
      id: business.id,
      name: business.name,
      sector: business.sector,
      companySize: business.companySize,
      region: business.region,
      stage: business.stage,
      circularModels: business.circularModels,
      headline: headlineScore(bundle),
      viability,
      viabilityBand: bandForScore(viability),
      resilience: bundle.resilience.score,
      investor,
      investorBand: bandForScore(investor),
      opportunity: bundle.opportunity.score,
      evidence,
      confidence: confidenceForScore(evidence),
      capex: business.inputs.capexRequirement,
      projectedOpportunity: business.inputs.annualRevenueUplift + business.inputs.annualCostSaving,
      viabilityBarriers: bundle.viability.negativeDrivers,
      investorBarriers: bundle.investor.negativeDrivers,
    } satisfies DashboardRow;
  }).sort((a, b) => b.headline - a.headline);
}
