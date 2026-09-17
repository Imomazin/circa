import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AssessmentInput, ScenarioInput } from "../validation/assessment";
import type { ScoreFamily } from "../scoring/commercial";

export const workspaces = pgTable("demo_workspaces", {
  id: uuid("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const organisations = pgTable(
  "organisations",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sector: text("sector").notNull(),
    region: text("region").notNull(),
    size: text("size").notNull(),
  },
  (t) => [index("org_workspace_sector").on(t.workspaceId, t.sector)],
);
export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    stage: text("stage").notNull().default("Assessment"),
    inputs: jsonb("inputs").$type<AssessmentInput>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("assessment_workspace_stage").on(t.workspaceId, t.stage)],
);
export const scenarios = pgTable(
  "financial_scenarios",
  {
    id: uuid("id").primaryKey(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    inputs: jsonb("inputs").$type<ScenarioInput>().notNull(),
    scores: jsonb("scores").$type<ScoreFamily[]>().notNull(),
    version: integer("version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("scenario_assessment_name").on(t.assessmentId, t.name)],
);
export const evidence = pgTable(
  "evidence_items",
  {
    id: uuid("id").primaryKey(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    status: text("status").notNull(),
    source: text("source").notNull(),
    quality: integer("quality").notNull(),
  },
  (t) => [index("evidence_assessment").on(t.assessmentId)],
);
export const audit = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    assessmentId: uuid("assessment_id").references(() => assessments.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    detail: text("detail").notNull(),
    actor: text("actor").notNull().default("Demo presenter"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("audit_workspace_time").on(t.workspaceId, t.createdAt)],
);
