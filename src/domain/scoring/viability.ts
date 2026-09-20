import { SCORE_DIMENSION_LABELS } from "../constants";
import type { AssessmentInputs, DimensionScore, ScoreComponent } from "./types";
import {
  bandForScore,
  capitalIntensityContribution,
  confidenceFrom,
  extractDrivers,
  invert,
  paybackContribution,
  weightedScore,
} from "./helpers";

/**
 * Commercial Viability.
 *
 * Answers the central Circa question: does this circular opportunity make
 * commercial sense? Blends market pull, revenue and margin potential, capital
 * intensity, payback, operational feasibility and downside risk.
 */
export function scoreViability(
  inputs: AssessmentInputs,
  evidenceScore: number,
  at: string,
): DimensionScore {
  const capitalContribution = capitalIntensityContribution(
    inputs.capexRequirement,
    inputs.annualRevenueUplift + inputs.annualCostSaving,
  );
  const payback = paybackContribution(inputs.paybackYears);

  const components: ScoreComponent[] = [
    {
      key: "market",
      label: "Market attractiveness",
      value: inputs.marketAttractiveness,
      weight: 0.13,
      description: "Size, growth and structural pull of the target market.",
    },
    {
      key: "demand",
      label: "Customer demand",
      value: inputs.customerDemand,
      weight: 0.13,
      description: "Strength and evidence of demand for the circular proposition.",
    },
    {
      key: "revenue",
      label: "Revenue potential",
      value: inputs.revenuePotential,
      weight: 0.12,
      description: "Scale of the incremental revenue opportunity.",
    },
    {
      key: "margin",
      label: "Margin potential",
      value: inputs.marginPotential,
      weight: 0.12,
      description: "Gross margin quality of the circular model.",
    },
    {
      key: "capital",
      label: "Capital efficiency",
      value: capitalContribution,
      weight: 0.13,
      description: "Capex required relative to the annual commercial benefit it unlocks.",
    },
    {
      key: "payback",
      label: "Payback",
      value: payback,
      weight: 0.1,
      description: "Speed at which the investment is recovered.",
    },
    {
      key: "feasibility",
      label: "Operational feasibility",
      value: inputs.operationalFeasibility,
      weight: 0.1,
      description: "Practicality of delivering the model with current capability.",
    },
    {
      key: "scalability",
      label: "Scalability",
      value: inputs.scalability,
      weight: 0.07,
      description: "Headroom to grow the model without proportional cost.",
    },
    {
      key: "risk",
      label: "Commercial risk (inverted)",
      value: invert(inputs.commercialRisk),
      weight: 0.06,
      description: "Lower commercial risk raises viability.",
    },
    {
      key: "resource",
      label: "Resource exposure (inverted)",
      value: invert(inputs.resourceExposure),
      weight: 0.04,
      description: "Lower dependence on volatile or scarce resources raises viability.",
    },
  ];

  const score = weightedScore(components);
  const { positiveDrivers, negativeDrivers } = extractDrivers(components);

  const missingEvidence: string[] = [];
  if (inputs.customerEvidence < 50)
    missingEvidence.push("Direct customer demand evidence (interviews, LOIs, pilots)");
  if (inputs.marginPotential > 65 && inputs.unitEconomics < 50)
    missingEvidence.push("Unit-economics substantiation for the assumed margins");

  const recommendations: string[] = [];
  if (capitalContribution < 45)
    recommendations.push("Reduce or phase capital expenditure to improve payback.");
  if (inputs.customerDemand < 55)
    recommendations.push("Validate customer demand before scaling investment.");
  if (payback < 40)
    recommendations.push("Model a lower-capex entry route to shorten payback.");

  return {
    dimension: "viability",
    label: SCORE_DIMENSION_LABELS.viability,
    score,
    band: bandForScore(score),
    confidence: confidenceFrom(evidenceScore),
    components,
    positiveDrivers,
    negativeDrivers,
    missingEvidence,
    recommendations,
    calculatedAt: at,
  };
}
