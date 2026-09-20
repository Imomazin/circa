import {
  pgTable,
  text,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import type { AssessmentInputs, ScoreBundle } from "../domain/scoring/types";
import type { FinancialBaseline, ScenarioAssumptions } from "../domain/scenarios/model";
import type { Recommendation } from "../domain/recommendations/engine";

/**
 * Circa relational schema (Drizzle ORM / PostgreSQL / Neon).
 *
 * Design notes:
 *  - Controlled vocabularies (sector, stage, circular models) are stored as
 *    text validated by Zod at the application boundary rather than PG enums, so
 *    the vocabulary can evolve without a migration.
 *  - Rich, engine-facing structures (assessment inputs, score bundles, scenario
 *    assumptions) are stored as typed JSONB. This keeps the scoring engine as
 *    the single source of truth for those shapes. See docs/data-model.md.
 */

export const organisations = pgTable(
  "organisations",
  {
    id: text("id").primaryKey(), // slug, e.g. "caledon-furniture-works"
    name: text("name").notNull(),
    sector: text("sector").notNull(),
    companySize: text("company_size").notNull(),
    region: text("region").notNull(),
    description: text("description").notNull(),
    currentOperatingModel: text("current_operating_model").notNull(),
    currentRevenueModel: text("current_revenue_model").notNull(),
    productsServices: text("products_services").notNull(),
    customerModel: text("customer_model").notNull(),
    commercialPressures: text("commercial_pressures").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sectorIdx: index("org_sector_idx").on(t.sector),
  }),
);

export const demoUsers = pgTable("demo_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull(), // e.g. "Programme manager", "Commercial analyst"
  organisationId: text("organisation_id").references(() => organisations.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessments = pgTable(
  "assessments",
  {
    id: text("id").primaryKey(), // slug
    organisationId: text("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    stage: text("stage").notNull(), // AssessmentStage
    circularModels: jsonb("circular_models").$type<string[]>().notNull(),
    opportunitySummary: text("opportunity_summary").notNull(),
    commercialRationale: text("commercial_rationale").notNull(),
    inputs: jsonb("inputs").$type<AssessmentInputs>().notNull(),
    baseline: jsonb("baseline").$type<FinancialBaseline>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index("assessment_org_idx").on(t.organisationId),
    stageIdx: index("assessment_stage_idx").on(t.stage),
  }),
);

export const scores = pgTable(
  "scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    headline: doublePrecision("headline").notNull(),
    viability: doublePrecision("viability").notNull(),
    resilience: doublePrecision("resilience").notNull(),
    investor: doublePrecision("investor").notNull(),
    opportunity: doublePrecision("opportunity").notNull(),
    evidence: doublePrecision("evidence").notNull(),
    // Optional cache of the full engine output. The scoring engine is
    // deterministic, so the app recomputes the bundle from `assessments.inputs`
    // for detail views; this column is available for caching but may be null.
    bundle: jsonb("bundle").$type<ScoreBundle>(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    assessmentIdx: index("score_assessment_idx").on(t.assessmentId),
  }),
);

export const financialScenarios = pgTable(
  "financial_scenarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    scenarioType: text("scenario_type").notNull(), // ScenarioType
    label: text("label").notNull(),
    assumptions: jsonb("assumptions").$type<ScenarioAssumptions>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    assessmentIdx: index("scenario_assessment_idx").on(t.assessmentId),
  }),
);

export const evidenceItems = pgTable(
  "evidence_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // EvidenceType
    description: text("description").notNull(),
    source: text("source").notNull(),
    confidence: integer("confidence").notNull(), // 0-100
    linkedArea: text("linked_area").notNull(), // which assessment area it supports
    status: text("status").notNull(), // EvidenceStatus
    dateRecorded: timestamp("date_recorded", { withTimezone: true }).notNull(),
  },
  (t) => ({
    assessmentIdx: index("evidence_assessment_idx").on(t.assessmentId),
  }),
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    rationale: text("rationale").notNull(),
    priority: text("priority").notNull(),
    category: text("category").notNull(),
  },
  (t) => ({
    assessmentIdx: index("recommendation_assessment_idx").on(t.assessmentId),
  }),
);

export const resourceDependencies = pgTable("resource_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: text("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  material: text("material").notNull(),
  criticality: text("criticality").notNull(), // High / Medium / Low
  annualSpend: doublePrecision("annual_spend").notNull(),
  volatility: text("volatility").notNull(), // High / Medium / Low
  notes: text("notes").notNull(),
});

export const supplierRisks = pgTable("supplier_risks", {
  id: uuid("id").primaryKey().defaultRandom(),
  organisationId: text("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  supplier: text("supplier").notNull(),
  category: text("category").notNull(),
  shareOfSupplyPct: integer("share_of_supply_pct").notNull(),
  region: text("region").notNull(),
  riskLevel: text("risk_level").notNull(), // High / Medium / Low
});

export const sectorBenchmarks = pgTable("sector_benchmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  sector: text("sector").notNull().unique(),
  avgViability: doublePrecision("avg_viability").notNull(),
  avgResilience: doublePrecision("avg_resilience").notNull(),
  avgInvestor: doublePrecision("avg_investor").notNull(),
  avgCapexRequirement: doublePrecision("avg_capex_requirement").notNull(),
  commonModel: text("common_model").notNull(),
});

export const programmeInsights = pgTable("programme_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  metric: text("metric").notNull(),
  category: text("category").notNull(),
  value: doublePrecision("value").notNull(),
  unit: text("unit").notNull(),
  note: text("note").notNull(),
});

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    actor: text("actor").notNull(),
    detail: text("detail").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index("audit_entity_idx").on(t.entityType, t.entityId),
    createdIdx: index("audit_created_idx").on(t.createdAt),
  }),
);

// Convenience row types inferred from the schema.
export type Organisation = typeof organisations.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type ScoreRow = typeof scores.$inferSelect;
export type FinancialScenarioRow = typeof financialScenarios.$inferSelect;
export type EvidenceItemRow = typeof evidenceItems.$inferSelect;
export type RecommendationRow = typeof recommendations.$inferSelect;
export type ResourceDependencyRow = typeof resourceDependencies.$inferSelect;
export type SupplierRiskRow = typeof supplierRisks.$inferSelect;
export type SectorBenchmarkRow = typeof sectorBenchmarks.$inferSelect;
export type ProgrammeInsightRow = typeof programmeInsights.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
export type { Recommendation };
