import { SCORE_DIMENSION_LABELS } from "../constants";
import type { AssessmentInputs, DimensionScore, ScoreComponent } from "./types";
import {
  bandForScore,
  confidenceFrom,
  extractDrivers,
  weightedScore,
} from "./helpers";

/**
 * Investor Readiness.
 *
 * How close the opportunity is to being fundable — evidence, traction, unit
 * economics, capability, clarity of capital ask and risk understanding.
 */
export function scoreInvestor(
  inputs: AssessmentInputs,
  evidenceScore: number,
  at: string,
): DimensionScore {
  const components: ScoreComponent[] = [
    {
      key: "customerEvidence",
      label: "Customer evidence",
      value: inputs.customerEvidence,
      weight: 0.13,
      description: "Depth of evidence that customers want and will pay for this.",
    },
    {
      key: "marketValidation",
      label: "Market validation",
      value: inputs.marketValidation,
      weight: 0.1,
      description: "External validation of market size and dynamics.",
    },
    {
      key: "traction",
      label: "Commercial traction",
      value: inputs.commercialTraction,
      weight: 0.12,
      description: "Real commercial activity — pilots, sales, pipeline.",
    },
    {
      key: "unitEconomics",
      label: "Unit economics",
      value: inputs.unitEconomics,
      weight: 0.13,
      description: "Clarity and quality of per-unit / per-customer economics.",
    },
    {
      key: "management",
      label: "Management capability",
      value: inputs.managementCapability,
      weight: 0.1,
      description: "Strength of the leadership team to execute.",
    },
    {
      key: "operating",
      label: "Operating capability",
      value: inputs.operatingCapability,
      weight: 0.08,
      description: "Operational capacity to deliver the model.",
    },
    {
      key: "scalability",
      label: "Scalability",
      value: inputs.scalability,
      weight: 0.08,
      description: "Ability to grow returns without proportional cost.",
    },
    {
      key: "capitalClarity",
      label: "Capital-requirement clarity",
      value: inputs.capitalClarity,
      weight: 0.08,
      description: "Clarity and credibility of the capital ask and its use.",
    },
    {
      key: "risk",
      label: "Risk understanding",
      value: inputs.riskUnderstanding,
      weight: 0.06,
      description: "How well risks are identified and mitigated.",
    },
    {
      key: "resourceSecurity",
      label: "Resource security",
      value: inputs.resourceSecurityBenefit,
      weight: 0.04,
      description: "Security of the resources the model depends on.",
    },
    {
      key: "proposition",
      label: "Circular proposition clarity",
      value: inputs.circularPropositionClarity,
      weight: 0.04,
      description: "Clarity of the circular value proposition.",
    },
    {
      key: "dataQuality",
      label: "Data quality",
      value: inputs.dataQuality,
      weight: 0.04,
      description: "Quality of the data underpinning the case.",
    },
  ];

  const score = weightedScore(components);
  const { positiveDrivers, negativeDrivers } = extractDrivers(components);

  const missingEvidence: string[] = [];
  if (inputs.customerEvidence < 55)
    missingEvidence.push("Customer commitment evidence (LOIs, contracts, pilots)");
  if (inputs.unitEconomics < 55)
    missingEvidence.push("Validated unit-economics model");
  if (inputs.commercialTraction < 50)
    missingEvidence.push("Demonstrable commercial traction");

  const recommendations: string[] = [];
  if (inputs.unitEconomics < 55)
    recommendations.push("Improve and evidence unit economics before approaching funders.");
  if (inputs.commercialTraction < 50)
    recommendations.push("Run a paid pilot to establish commercial traction.");
  if (inputs.capitalClarity < 55)
    recommendations.push("Sharpen the capital requirement and use-of-funds narrative.");
  if (inputs.managementCapability < 55)
    recommendations.push("Strengthen management capacity or advisory board.");

  return {
    dimension: "investor",
    label: SCORE_DIMENSION_LABELS.investor,
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
