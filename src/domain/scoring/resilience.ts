import { SCORE_DIMENSION_LABELS } from "../constants";
import type { AssessmentInputs, DimensionScore, ScoreComponent } from "./types";
import {
  bandForScore,
  confidenceFrom,
  extractDrivers,
  invert,
  weightedScore,
} from "./helpers";

/**
 * Commercial Resilience.
 *
 * How well the business can withstand supply, resource and demand shocks —
 * a core part of the circular-economy commercial thesis (circular models
 * often reduce exposure to volatile virgin-material markets).
 */
export function scoreResilience(
  inputs: AssessmentInputs,
  evidenceScore: number,
  at: string,
): DimensionScore {
  const components: ScoreComponent[] = [
    {
      key: "supplier",
      label: "Supplier diversification",
      value: invert(inputs.supplierConcentration),
      weight: 0.12,
      description: "Lower supplier concentration improves resilience.",
    },
    {
      key: "material",
      label: "Material independence",
      value: invert(inputs.materialDependency),
      weight: 0.1,
      description: "Lower dependency on a single critical material improves resilience.",
    },
    {
      key: "import",
      label: "Import exposure (inverted)",
      value: invert(inputs.importExposure),
      weight: 0.08,
      description: "Lower reliance on imported inputs improves resilience.",
    },
    {
      key: "volatility",
      label: "Resource-price stability",
      value: invert(inputs.resourcePriceVolatility),
      weight: 0.1,
      description: "Lower exposure to volatile resource prices improves resilience.",
    },
    {
      key: "substitution",
      label: "Substitution options",
      value: inputs.substitutionOptions,
      weight: 0.08,
      description: "Availability of alternative inputs or approaches.",
    },
    {
      key: "repair",
      label: "Repairability",
      value: inputs.repairability,
      weight: 0.07,
      description: "Ability to extend asset life through repair.",
    },
    {
      key: "reuse",
      label: "Reuse opportunity",
      value: inputs.reuseOpportunity,
      weight: 0.07,
      description: "Ability to recover value through reuse.",
    },
    {
      key: "diversity",
      label: "Revenue diversity",
      value: inputs.revenueDiversity,
      weight: 0.09,
      description: "Spread of revenue across streams and customers.",
    },
    {
      key: "recurring",
      label: "Recurring revenue",
      value: inputs.recurringRevenueShare,
      weight: 0.11,
      description: "Share of revenue that recurs (service, subscription, PaaS).",
    },
    {
      key: "retention",
      label: "Customer retention",
      value: inputs.customerRetention,
      weight: 0.08,
      description: "Strength of customer relationships and repeat business.",
    },
    {
      key: "flexibility",
      label: "Operational flexibility",
      value: inputs.operationalFlexibility,
      weight: 0.1,
      description: "Ability to flex operations in response to shocks.",
    },
  ];

  const score = weightedScore(components);
  const { positiveDrivers, negativeDrivers } = extractDrivers(components);

  const missingEvidence: string[] = [];
  if (inputs.supplierConcentration > 60)
    missingEvidence.push("Alternative supplier options and switching costs");
  if (inputs.recurringRevenueShare > 50 && inputs.customerRetention < 55)
    missingEvidence.push("Retention data supporting recurring-revenue assumptions");

  const recommendations: string[] = [];
  if (inputs.supplierConcentration > 60)
    recommendations.push("Reduce supplier concentration to de-risk supply.");
  if (inputs.recurringRevenueShare < 40)
    recommendations.push(
      "Test subscription / product-as-a-service pricing to build recurring revenue.",
    );
  if (inputs.resourcePriceVolatility > 60)
    recommendations.push("Secure supply agreements to dampen resource-price volatility.");

  return {
    dimension: "resilience",
    label: SCORE_DIMENSION_LABELS.resilience,
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
