CREATE TABLE IF NOT EXISTS "assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"organisation_id" text NOT NULL,
	"title" text NOT NULL,
	"stage" text NOT NULL,
	"circular_models" jsonb NOT NULL,
	"opportunity_summary" text NOT NULL,
	"commercial_rationale" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"baseline" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"actor" text NOT NULL,
	"detail" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demo_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"organisation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"source" text NOT NULL,
	"confidence" integer NOT NULL,
	"linked_area" text NOT NULL,
	"status" text NOT NULL,
	"date_recorded" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" text NOT NULL,
	"scenario_type" text NOT NULL,
	"label" text NOT NULL,
	"assumptions" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organisations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sector" text NOT NULL,
	"company_size" text NOT NULL,
	"region" text NOT NULL,
	"description" text NOT NULL,
	"current_operating_model" text NOT NULL,
	"current_revenue_model" text NOT NULL,
	"products_services" text NOT NULL,
	"customer_model" text NOT NULL,
	"commercial_pressures" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programme_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric" text NOT NULL,
	"category" text NOT NULL,
	"value" double precision NOT NULL,
	"unit" text NOT NULL,
	"note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"rationale" text NOT NULL,
	"priority" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resource_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" text NOT NULL,
	"material" text NOT NULL,
	"criticality" text NOT NULL,
	"annual_spend" double precision NOT NULL,
	"volatility" text NOT NULL,
	"notes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" text NOT NULL,
	"headline" double precision NOT NULL,
	"viability" double precision NOT NULL,
	"resilience" double precision NOT NULL,
	"investor" double precision NOT NULL,
	"opportunity" double precision NOT NULL,
	"evidence" double precision NOT NULL,
	"bundle" jsonb,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sector_benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sector" text NOT NULL,
	"avg_viability" double precision NOT NULL,
	"avg_resilience" double precision NOT NULL,
	"avg_investor" double precision NOT NULL,
	"avg_capex_requirement" double precision NOT NULL,
	"common_model" text NOT NULL,
	CONSTRAINT "sector_benchmarks_sector_unique" UNIQUE("sector")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" text NOT NULL,
	"supplier" text NOT NULL,
	"category" text NOT NULL,
	"share_of_supply_pct" integer NOT NULL,
	"region" text NOT NULL,
	"risk_level" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "demo_users" ADD CONSTRAINT "demo_users_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_scenarios" ADD CONSTRAINT "financial_scenarios_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resource_dependencies" ADD CONSTRAINT "resource_dependencies_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scores" ADD CONSTRAINT "scores_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "supplier_risks" ADD CONSTRAINT "supplier_risks_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_org_idx" ON "assessments" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assessment_stage_idx" ON "assessments" USING btree ("stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_created_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_assessment_idx" ON "evidence_items" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scenario_assessment_idx" ON "financial_scenarios" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_sector_idx" ON "organisations" USING btree ("sector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recommendation_assessment_idx" ON "recommendations" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "score_assessment_idx" ON "scores" USING btree ("assessment_id");