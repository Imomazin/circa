import type { AssessmentInputs } from "./types";

/**
 * Neutral starting point for a new assessment's inputs. Every sub-rating sits
 * at a middling value; the creation wizard overrides the distinctive fields and
 * leaves the rest here, to be refined later in the full assessment editor.
 */
export const NEUTRAL_INPUTS: AssessmentInputs = {
  marketAttractiveness: 55,
  customerDemand: 55,
  revenuePotential: 55,
  marginPotential: 55,
  scalability: 50,
  operationalFeasibility: 55,
  capexRequirement: 250000,
  annualRevenueUplift: 150000,
  annualCostSaving: 80000,
  paybackYears: 3,
  commercialRisk: 45,
  resourceExposure: 45,
  supplierConcentration: 45,
  materialDependency: 45,
  importExposure: 40,
  resourcePriceVolatility: 45,
  substitutionOptions: 50,
  repairability: 50,
  reuseOpportunity: 50,
  revenueDiversity: 50,
  recurringRevenueShare: 25,
  customerRetention: 60,
  operationalFlexibility: 55,
  customerEvidence: 50,
  marketValidation: 50,
  commercialTraction: 45,
  unitEconomics: 50,
  managementCapability: 55,
  operatingCapability: 55,
  capitalClarity: 50,
  riskUnderstanding: 50,
  circularPropositionClarity: 55,
  dataQuality: 50,
  materialRecoveryPotential: 50,
  lifetimeExtensionPotential: 50,
  circularRevenueModelStrength: 50,
  supplyChainBenefit: 50,
  resourceSecurityBenefit: 50,
  evidenceCoverage: 50,
  evidenceRecency: 50,
  evidenceIndependence: 45,
  evidenceVerification: 45,
};

/** A sensible starting circular-case scenario for a new business. */
export const NEUTRAL_CIRCULAR = {
  revenueDeltaPct: 12,
  materialCostDeltaPct: -10,
  energyCostDeltaPct: 4,
  labourCostDeltaPct: 8,
  opexDeltaPct: 5,
  maintenanceDeltaPct: 8,
  capex: 250000,
  workingCapitalDelta: 60000,
  recurringRevenueSharePct: 30,
  customerRetentionPct: 75,
  residualValue: 80000,
};
