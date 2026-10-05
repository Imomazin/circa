import { z } from "zod";
import {
  SCENARIO_TYPES,
  SECTORS,
  COMPANY_SIZES,
  ASSESSMENT_STAGES,
  CIRCULAR_MODELS,
  EVIDENCE_TYPES,
  EVIDENCE_STATUSES,
} from "@/domain/constants";

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

const text = (max: number) => z.string().trim().min(1).max(max);

export const financialBaselineSchema = z.object({
  revenue: money,
  materialCost: money,
  energyCost: money,
  labourCost: money,
  opex: money,
  maintenanceCost: money,
  workingCapital: money,
});

/** Create a new business + circular-opportunity assessment. */
export const createBusinessSchema = z.object({
  name: text(120),
  sector: z.enum(SECTORS),
  companySize: z.enum(COMPANY_SIZES),
  region: text(80),
  description: text(600),
  currentOperatingModel: text(600),
  currentRevenueModel: text(600),
  productsServices: text(600),
  customerModel: text(600),
  commercialPressures: text(600),
  stage: z.enum(ASSESSMENT_STAGES),
  circularModels: z.array(z.enum(CIRCULAR_MODELS)).min(1).max(CIRCULAR_MODELS.length),
  opportunitySummary: text(800),
  commercialRationale: text(800),
  baseline: financialBaselineSchema,
  circular: scenarioAssumptionsSchema,
  inputs: assessmentInputsSchema,
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

/** Add an evidence item to an assessment. */
export const addEvidenceSchema = z.object({
  assessmentId: z.string().min(1).max(120),
  type: z.enum(EVIDENCE_TYPES),
  description: text(400),
  source: text(160),
  confidence: z.number().int().min(0).max(100),
  linkedArea: text(120),
  status: z.enum(EVIDENCE_STATUSES),
});

export const deleteEvidenceSchema = z.object({
  assessmentId: z.string().min(1).max(120),
  evidenceId: z.string().uuid(),
});
