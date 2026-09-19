import { SCORE_DIMENSION_LABELS } from "../constants";
import type { AssessmentInputs, DimensionScore, ScoreComponent } from "./types";
import {
  bandForScore,
  confidenceFrom,
  extractDrivers,
  weightedScore,
} from "./helpers";

/**
 * Circular Opportunity.
 *
 * The strength of the underlying circular-economy opportunity itself —
 * material recovery, lifetime extension, circular revenue-model strength and
 * the supply-chain / resource-security benefits it delivers.
 */
export function scoreOpportunity(
  inputs: AssessmentInputs,
  evidenceScore: number,
  at: string,
): DimensionScore {
  const components: ScoreComponent[] = [
    {
      key: "materialRecovery",
      label: "Material recovery potential",
      value: inputs.materialRecoveryPotential,
      weight: 0.22,
      description: "Value recoverable from materials kept in use.",
    },
    {
      key: "lifetime",
      label: "Lifetime extension potential",
      value: inputs.lifetimeExtensionPotential,
      weight: 0.2,
      description: "Value from extending product / asset life.",
    },
    {
      key: "circularRevenue",
      label: "Circular revenue-model strength",
      value: inputs.circularRevenueModelStrength,
      weight: 0.24,
      description: "How well the circular model converts into durable revenue.",
    },
    {
      key: "supplyChain",
      label: "Supply-chain benefit",
      value: inputs.supplyChainBenefit,
      weight: 0.17,
      description: "Resilience and cost benefit to the supply chain.",
    },
    {
      key: "resourceSecurity",
      label: "Resource-security benefit",
      value: inputs.resourceSecurityBenefit,
      weight: 0.17,
      description: "Improvement in security of critical resources.",
    },
  ];

  const score = weightedScore(components);
  const { positiveDrivers, negativeDrivers } = extractDrivers(components);

  const missingEvidence: string[] = [];
  if (inputs.materialRecoveryPotential > 60 && inputs.evidenceVerification < 50)
    missingEvidence.push("Measured material-recovery yields from pilot data");

  const recommendations: string[] = [];
  if (inputs.circularRevenueModelStrength < 55)
    recommendations.push(
      "Strengthen the circular revenue model — link recovered value to a repeatable revenue stream.",
    );
  if (inputs.supplyChainBenefit < 50)
    recommendations.push("Quantify supply-chain cost and resilience benefits.");

  return {
    dimension: "opportunity",
    label: SCORE_DIMENSION_LABELS.opportunity,
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
