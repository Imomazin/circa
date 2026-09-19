import type {
  ConfidenceLevel,
  ScoreBand,
  ScoreDimension,
} from "../constants";

/**
 * Normalised assessment inputs consumed by the scoring engine.
 *
 * Most fields are 0-100 sub-ratings captured during the assessment workflow.
 * A handful are absolute financial figures used by the viability capital and
 * payback logic. The engine is intentionally pure: it takes this object and
 * returns scores, with no database or React dependency.
 */
export interface AssessmentInputs {
  // --- Market & demand ---
  marketAttractiveness: number; // 0-100
  customerDemand: number; // 0-100
  revenuePotential: number; // 0-100
  marginPotential: number; // 0-100
  scalability: number; // 0-100
  operationalFeasibility: number; // 0-100

  // --- Capital & returns (absolute figures, GBP) ---
  capexRequirement: number; // one-off capital, GBP
  annualRevenueUplift: number; // expected incremental annual revenue, GBP
  annualCostSaving: number; // expected incremental annual saving, GBP
  paybackYears: number; // expected simple payback, years

  // --- Risk ---
  commercialRisk: number; // 0-100 where higher = more risk
  resourceExposure: number; // 0-100 where higher = more exposure

  // --- Resilience factors ---
  supplierConcentration: number; // 0-100 where higher = more concentrated (worse)
  materialDependency: number; // 0-100 where higher = more dependent (worse)
  importExposure: number; // 0-100 where higher = more import-exposed (worse)
  resourcePriceVolatility: number; // 0-100 where higher = more volatile (worse)
  substitutionOptions: number; // 0-100 where higher = more options (better)
  repairability: number; // 0-100
  reuseOpportunity: number; // 0-100
  revenueDiversity: number; // 0-100
  recurringRevenueShare: number; // 0-100 (% of revenue that is recurring)
  customerRetention: number; // 0-100
  operationalFlexibility: number; // 0-100

  // --- Investor readiness factors ---
  customerEvidence: number; // 0-100
  marketValidation: number; // 0-100
  commercialTraction: number; // 0-100
  unitEconomics: number; // 0-100
  managementCapability: number; // 0-100
  operatingCapability: number; // 0-100
  capitalClarity: number; // 0-100
  riskUnderstanding: number; // 0-100
  circularPropositionClarity: number; // 0-100
  dataQuality: number; // 0-100

  // --- Circular opportunity factors ---
  materialRecoveryPotential: number; // 0-100
  lifetimeExtensionPotential: number; // 0-100
  circularRevenueModelStrength: number; // 0-100
  supplyChainBenefit: number; // 0-100
  resourceSecurityBenefit: number; // 0-100

  // --- Evidence quality (drives confidence) ---
  evidenceCoverage: number; // 0-100 breadth of evidence across areas
  evidenceRecency: number; // 0-100 how current the evidence is
  evidenceIndependence: number; // 0-100 external vs internal
  evidenceVerification: number; // 0-100 verified vs unverified
}

export interface ScoreComponent {
  key: string;
  label: string;
  /** Raw normalised contribution 0-100 for this component. */
  value: number;
  /** Weight applied within the dimension (sums to 1 across components). */
  weight: number;
  /** Human explanation of what this component measures. */
  description: string;
}

export interface DimensionScore {
  dimension: ScoreDimension;
  label: string;
  score: number; // 0-100
  band: ScoreBand;
  confidence: ConfidenceLevel;
  components: ScoreComponent[];
  positiveDrivers: string[];
  negativeDrivers: string[];
  missingEvidence: string[];
  recommendations: string[];
  calculatedAt: string; // ISO timestamp
}

export interface ScoreBundle {
  viability: DimensionScore;
  resilience: DimensionScore;
  investor: DimensionScore;
  opportunity: DimensionScore;
  evidence: DimensionScore;
}
