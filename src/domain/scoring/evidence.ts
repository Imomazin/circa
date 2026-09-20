import { SCORE_DIMENSION_LABELS } from "../constants";
import type { AssessmentInputs, DimensionScore, ScoreComponent } from "./types";
import {
  bandForScore,
  confidenceFrom,
  extractDrivers,
  weightedScore,
} from "./helpers";

/**
 * Evidence Confidence.
 *
 * Measures how much weight a decision-maker can place on the other scores.
 * A high commercial viability with low evidence confidence is a flag, not a
 * green light — the dashboard surfaces exactly that combination.
 */
export function scoreEvidence(inputs: AssessmentInputs, at: string): DimensionScore {
  const components: ScoreComponent[] = [
    {
      key: "coverage",
      label: "Evidence coverage",
      value: inputs.evidenceCoverage,
      weight: 0.3,
      description: "Breadth of evidence across the assessed commercial areas.",
    },
    {
      key: "recency",
      label: "Evidence recency",
      value: inputs.evidenceRecency,
      weight: 0.2,
      description: "How current the supporting evidence is.",
    },
    {
      key: "independence",
      label: "Source independence",
      value: inputs.evidenceIndependence,
      weight: 0.25,
      description: "Proportion of external / independent evidence vs internal estimates.",
    },
    {
      key: "verification",
      label: "Verification status",
      value: inputs.evidenceVerification,
      weight: 0.25,
      description: "Share of evidence that has been verified rather than asserted.",
    },
  ];

  const score = weightedScore(components);
  const { positiveDrivers, negativeDrivers } = extractDrivers(components);

  const missingEvidence: string[] = [];
  if (inputs.evidenceIndependence < 50)
    missingEvidence.push("Independent / third-party validation of key claims");
  if (inputs.evidenceVerification < 50)
    missingEvidence.push("Verification of provisional evidence items");
  if (inputs.evidenceRecency < 50)
    missingEvidence.push("Refreshed evidence — current items may be dated");

  const recommendations: string[] = [];
  if (score < 50)
    recommendations.push(
      "Prioritise evidence gathering before presenting scores to funders.",
    );
  if (inputs.evidenceIndependence < 55)
    recommendations.push("Commission independent market or customer validation.");

  return {
    dimension: "evidence",
    label: SCORE_DIMENSION_LABELS.evidence,
    score,
    band: bandForScore(score),
    confidence: confidenceFrom(score),
    components,
    positiveDrivers,
    negativeDrivers,
    missingEvidence,
    recommendations,
    calculatedAt: at,
  };
}
