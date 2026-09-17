CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"organisation_id" uuid NOT NULL,
	"stage" text DEFAULT 'Assessment' NOT NULL,
	"inputs" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"assessment_id" uuid,
	"action" text NOT NULL,
	"detail" text NOT NULL,
	"actor" text DEFAULT 'Demo presenter' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"assessment_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"quality" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sector" text NOT NULL,
	"region" text NOT NULL,
	"size" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_scenarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"assessment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"scores" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_workspaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "demo_workspaces_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_workspace_id_demo_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."demo_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_workspace_id_demo_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."demo_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_workspace_id_demo_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."demo_workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_scenarios" ADD CONSTRAINT "financial_scenarios_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_workspace_stage" ON "assessments" USING btree ("workspace_id","stage");--> statement-breakpoint
CREATE INDEX "audit_workspace_time" ON "audit_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "evidence_assessment" ON "evidence_items" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "org_workspace_sector" ON "organisations" USING btree ("workspace_id","sector");--> statement-breakpoint
CREATE UNIQUE INDEX "scenario_assessment_name" ON "financial_scenarios" USING btree ("assessment_id","name");