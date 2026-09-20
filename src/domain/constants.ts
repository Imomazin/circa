/**
 * Circa domain constants.
 *
 * Single source of truth for the controlled vocabularies used across the
 * scoring engine, database seed and UI. Keeping these here (rather than
 * scattered through components) means the scoring logic and the interface
 * always agree on the same enumerations.
 */

export const CIRCULAR_MODELS = [
  "Reuse",
  "Repair",
  "Refurbishment",
  "Remanufacturing",
  "Take-back",
  "Leasing",
  "Subscription",
  "Product-as-a-Service",
  "Sharing",
  "Closed-loop material recovery",
  "Waste-to-value",
  "Lifetime extension",
] as const;
export type CircularModel = (typeof CIRCULAR_MODELS)[number];

export const SECTORS = [
  "Manufacturing",
  "Textiles",
  "Food & Drink",
  "Construction",
  "Electronics",
  "Furniture",
  "Equipment Rental",
  "Consumer Goods",
  "Packaging",
  "Industrial Services",
] as const;
export type Sector = (typeof SECTORS)[number];

export const COMPANY_SIZES = [
  "Micro (1-9)",
  "Small (10-49)",
  "Medium (50-249)",
  "Large (250+)",
] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const ASSESSMENT_STAGES = [
  "Draft",
  "In Review",
  "Validated",
  "Investment Ready",
] as const;
export type AssessmentStage = (typeof ASSESSMENT_STAGES)[number];

export const EVIDENCE_TYPES = [
  "Customer interview",
  "Supplier quote",
  "Market study",
  "Financial record",
  "Pilot data",
  "Internal estimate",
  "External benchmark",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_STATUSES = ["Verified", "Provisional", "Unverified"] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const SCORE_DIMENSIONS = [
  "viability",
  "resilience",
  "investor",
  "opportunity",
  "evidence",
] as const;
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export const SCORE_DIMENSION_LABELS: Record<ScoreDimension, string> = {
  viability: "Commercial Viability",
  resilience: "Commercial Resilience",
  investor: "Investor Readiness",
  opportunity: "Circular Opportunity",
  evidence: "Evidence Confidence",
};

/** Score bands, ordered low → high. */
export const SCORE_BANDS = ["Weak", "Emerging", "Developing", "Strong", "Compelling"] as const;
export type ScoreBand = (typeof SCORE_BANDS)[number];

export const RECOMMENDATION_PRIORITIES = ["High", "Medium", "Low"] as const;
export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];

export const SCENARIO_TYPES = [
  "baseline",
  "circular_base",
  "upside",
  "downside",
] as const;
export type ScenarioType = (typeof SCENARIO_TYPES)[number];

export const SCENARIO_LABELS: Record<ScenarioType, string> = {
  baseline: "Current baseline",
  circular_base: "Circular base case",
  upside: "Upside case",
  downside: "Downside case",
};

/** Map a 0-100 score to a band. */
export function bandForScore(score: number): ScoreBand {
  if (score >= 80) return "Compelling";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Developing";
  if (score >= 35) return "Emerging";
  return "Weak";
}

/** Confidence level derived from evidence confidence score. */
export type ConfidenceLevel = "Low" | "Moderate" | "High";
export function confidenceForScore(evidenceScore: number): ConfidenceLevel {
  if (evidenceScore >= 70) return "High";
  if (evidenceScore >= 45) return "Moderate";
  return "Low";
}

export const CURRENCY = "GBP";
