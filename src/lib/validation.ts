import { z } from "zod";
import { SCENARIO_TYPES } from "@/domain/constants";

/**
 * Centralised validation schemas.
 *
 * All server actions validate their inputs through these schemas before
 * touching the database, so invalid or hostile input never reaches the engine
 * or Postgres.
 */

const pctDelta = z.number().min(-100).max(500);
const money = z.number().min(0).max(1_000_000_000);
const share = z.number().min(0).max(100);

export const scenarioAssumptionsSchema = z.object({
  revenueDeltaPct: pctDelta,
  materialCostDeltaPct: pctDelta,
  energyCostDeltaPct: pctDelta,
  labourCostDeltaPct: pctDelta,
  opexDeltaPct: pctDelta,
  maintenanceDeltaPct: pctDelta,
  capex: money,
  workingCapitalDelta: z.number().min(-1_000_000_000).max(1_000_000_000),
  recurringRevenueSharePct: share,
  customerRetentionPct: share,
  residualValue: money,
});

export const updateScenarioSchema = z.object({
  assessmentId: z.string().min(1).max(120),
  scenarioType: z.enum(SCENARIO_TYPES),
  assumptions: scenarioAssumptionsSchema,
});

export const recalculateSchema = z.object({
  assessmentId: z.string().min(1).max(120),
});

export const resetDemoSchema = z.object({
  confirm: z.literal("RESET"),
});

/** A 0-100 assessment sub-rating. */
export const rating = z.number().min(0).max(100);

/** Full assessment-inputs schema for the assessment editor. */
export const assessmentInputsSchema = z.object({
  marketAttractiveness: rating,
  customerDemand: rating,
  revenuePotential: rating,
  marginPotential: rating,
  scalability: rating,
  operationalFeasibility: rating,
  capexRequirement: money,
  annualRevenueUplift: money,
  annualCostSaving: money,
  paybackYears: z.number().min(0).max(30),
  commercialRisk: rating,
  resourceExposure: rating,
  supplierConcentration: rating,
  materialDependency: rating,
  importExposure: rating,
  resourcePriceVolatility: rating,
  substitutionOptions: rating,
  repairability: rating,
  reuseOpportunity: rating,
  revenueDiversity: rating,
  recurringRevenueShare: rating,
  customerRetention: rating,
  operationalFlexibility: rating,
  customerEvidence: rating,
  marketValidation: rating,
  commercialTraction: rating,
  unitEconomics: rating,
  managementCapability: rating,
  operatingCapability: rating,
  capitalClarity: rating,
  riskUnderstanding: rating,
  circularPropositionClarity: rating,
  dataQuality: rating,
  materialRecoveryPotential: rating,
  lifetimeExtensionPotential: rating,
  circularRevenueModelStrength: rating,
  supplyChainBenefit: rating,
  resourceSecurityBenefit: rating,
  evidenceCoverage: rating,
  evidenceRecency: rating,
  evidenceIndependence: rating,
  evidenceVerification: rating,
});

export const updateAssessmentSchema = z.object({
  assessmentId: z.string().min(1).max(120),
  inputs: assessmentInputsSchema,
});

export type ScenarioAssumptionsInput = z.infer<typeof scenarioAssumptionsSchema>;
