# Data model

PostgreSQL (Neon), modelled with Drizzle ORM in `src/db/schema.ts`. Controlled vocabularies (sector, stage, circular models, evidence types) are stored as `text` validated by Zod at the application boundary rather than as PG enums, so the vocabulary can evolve without a migration. Rich engine-facing structures are stored as typed `jsonb`.

## Entities

| Table | Purpose | Key columns |
| --- | --- | --- |
| `organisations` | The business (SME) profile | `id` (slug PK), `name`, `sector`, `company_size`, `region`, operating/revenue model, products, customer model, commercial pressures |
| `demo_users` | Actor concept for future RBAC | `id`, `name`, `role`, `organisation_id` |
| `assessments` | Circular-opportunity assessment (1:1 with organisation) | `id` (slug PK), `organisation_id` (FK), `stage`, `circular_models` (jsonb string[]), `opportunity_summary`, `commercial_rationale`, `inputs` (jsonb `AssessmentInputs`), `baseline` (jsonb `FinancialBaseline`) |
| `scores` | Numeric score summary + recalculation timestamp | `assessment_id` (FK), `headline`, `viability`, `resilience`, `investor`, `opportunity`, `evidence`, `bundle` (optional jsonb cache), `calculated_at` |
| `financial_scenarios` | Editable assumption sets (4 per assessment) | `assessment_id` (FK), `scenario_type`, `label`, `assumptions` (jsonb `ScenarioAssumptions`), `updated_at` |
| `evidence_items` | Evidence supporting the assessment | `assessment_id` (FK), `type`, `description`, `source`, `confidence`, `linked_area`, `status`, `date_recorded` |
| `recommendations` | Persisted deterministic recommendations | `assessment_id` (FK), `code`, `title`, `rationale`, `priority`, `category` |
| `resource_dependencies` | Material dependencies of a business | `organisation_id` (FK), `material`, `criticality`, `annual_spend`, `volatility`, `notes` |
| `supplier_risks` | Supplier concentration/risk | `organisation_id` (FK), `supplier`, `category`, `share_of_supply_pct`, `region`, `risk_level` |
| `sector_benchmarks` | Aggregate reference per sector | `sector` (unique), `avg_viability`, `avg_resilience`, `avg_investor`, `avg_capex_requirement`, `common_model` |
| `programme_insights` | Aggregate programme metrics | `metric`, `category`, `value`, `unit`, `note` |
| `audit_events` | Trail of material actions | `action`, `entity_type`, `entity_id`, `actor`, `detail`, `created_at` |

## Relationships

```
organisations 1───1 assessments 1───1 scores
     │                   │
     │                   ├──< financial_scenarios (4: baseline, circular_base, upside, downside)
     │                   ├──< evidence_items
     │                   └──< recommendations
     ├──< resource_dependencies
     └──< supplier_risks

sector_benchmarks, programme_insights, audit_events  (standalone / aggregate)
```

All child tables cascade-delete with their parent. Indexes exist on the foreign keys and on frequently filtered columns (`organisations.sector`, `assessments.stage`, `audit_events (entity_type, entity_id)` and `created_at`).

## Typed JSON structures

Stored as `jsonb` with Drizzle `$type<T>()`:

- **`assessments.inputs` → `AssessmentInputs`** (`src/domain/scoring/types.ts`): ~45 normalised sub-ratings (0–100) plus absolute financial figures (capex, uplift, saving, payback). This is the sole input to the scoring engine.
- **`assessments.baseline` → `FinancialBaseline`**: the current-position P&L lines used by the scenario modeller.
- **`financial_scenarios.assumptions` → `ScenarioAssumptions`**: the editable levers for one scenario.
- **`assessments.circular_models` → `string[]`**: the circular models in play.

## Design notes / deviations from the brief's candidate list

The brief lists many candidate entities (e.g. `CircularOpportunity`, `CommercialInput`, `MarketEvidence`, `ScoreComponent`, `InvestorReadiness`, `SectorBenchmark`, `ProgrammeInsight`). Circa consolidates several of these for a tractable, coherent model:

- **CircularOpportunity / CommercialInput** are folded into `assessments` (each business has one circular-opportunity assessment holding the circular models, narrative and the full input vector).
- **ScoreComponent / InvestorReadiness** are not separate tables: score components and the investor-readiness breakdown are computed deterministically by the engine from `assessments.inputs` and rendered on demand, avoiding a denormalised copy that could drift.
- **MarketEvidence** is represented by `evidence_items` with a `type` of *Market study* (and other types).

`SectorBenchmark`, `ProgrammeInsight` and `AuditEvent` are implemented as tables.

## Migrations & seed

- `src/db/schema.ts` is the source of truth. `npm run db:generate` emits SQL to `drizzle/`.
- `npm run db:migrate` applies migrations; `-- --reset` drops and recreates the public schema for a clean rebuild.
- `npm run db:seed` loads a deterministic dataset of 12 synthetic Scottish businesses (`src/db/seed-core.ts` + `seed-data.ts`), deriving scores, scenarios and recommendations from the engine.
