/**
 * Circular network model.
 *
 * The network connects organisations through material flows. Each organisation
 * offers supply streams (what it can put back into circulation) and demand
 * streams (circular inputs it is seeking). The engine pairs compatible streams
 * into matches — the unit of commercial circular-economy opportunity.
 *
 * Everything is derived deterministically from the organisation dataset, so the
 * network is internally consistent: a supplier of a material in one view is the
 * same supplier everywhere else.
 */

export const MATERIAL_FAMILIES = [
  "Timber & board",
  "Textiles & fibre",
  "Metals & alloys",
  "Polymers & plastics",
  "Electronics & components",
  "Food & organic",
  "Glass & packaging",
  "Equipment & assets",
] as const;
export type MaterialFamily = (typeof MATERIAL_FAMILIES)[number];

export type StreamDirection = "supply" | "demand";
export type QualityGrade = "A" | "B" | "C";

export interface MaterialStream {
  id: string;
  orgId: string;
  direction: StreamDirection;
  family: MaterialFamily;
  /** Specific material name as the organisation describes it. */
  material: string;
  /** Indicative annual volume, tonnes. */
  annualVolumeTonnes: number;
  /** Indicative value, £ per tonne. */
  valuePerTonne: number;
  /** How ready this stream is to transact, 0–100. */
  readiness: number;
  /** Supply only: grade of the recovered material. */
  grade?: QualityGrade;
  /** Supply only: what currently happens to it. */
  currentFate?: string;
  /** Demand only: lowest grade the buyer can accept. */
  minGrade?: QualityGrade;
  /** Demand only: the specification the buyer needs. */
  specNeeded?: string;
}

/** The nine-stage circular-opportunity pipeline. */
export const PIPELINE_STAGES = [
  "Identified",
  "Matched",
  "Validated",
  "Engagement",
  "Feasibility",
  "Pilot",
  "Commercial agreement",
  "Implementation",
  "Realised",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface MatchConstraint {
  label: string;
  severity: "info" | "caution" | "blocker";
}

export interface OpportunityMatch {
  id: string;
  family: MaterialFamily;
  material: string;
  supplyStreamId: string;
  demandStreamId: string;
  supplierId: string;
  buyerId: string;
  /** Matched annual volume, tonnes (min of the two streams). */
  volumeTonnes: number;
  /** Indicative annual commercial value, £. */
  value: number;
  /** Indicative avoided disposal cost captured in the deal, £/yr. */
  avoidedDisposal: number;
  /** Road distance between the two sites, km (great-circle × road factor). */
  distanceKm: number;
  /** Indicative carbon benefit, tonnes CO2e per year. */
  carbonTonnes: number;
  /** Material diverted from landfill / virgin extraction, tonnes per year. */
  diversionTonnes: number;
  /** Composite 0–100 match strength. */
  strength: number;
  stage: PipelineStage;
  constraints: MatchConstraint[];
  recommendedAction: string;
  /** Deterministic owner initials for the workspace view. */
  owner: string;
}
