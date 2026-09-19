import { writeFileSync } from "node:fs";
import { BUSINESSES, PROGRAMME_INSIGHTS, type BusinessSpec } from "./seed-data";
import { computeScores, headlineScore } from "../domain/scoring";
import { generateRecommendations } from "../domain/recommendations/engine";
import { baselineAssumptions, type ScenarioAssumptions } from "../domain/scenarios/model";
import { SCENARIO_LABELS, type ScenarioType } from "../domain/constants";

/**
 * Emit the deterministic seed as a JSON array of SQL statements.
 *
 * Used only where direct DB egress is unavailable (e.g. a restricted build
 * container): the statements are executed through the Neon MCP tools instead.
 * The canonical seed path remains `npm run db:seed`. Output goes to the path in
 * argv[2] (default ./seed-sql.json).
 */

const SEED_DATE = new Date("2026-09-01T09:00:00.000Z");
const SEED_ISO = SEED_DATE.toISOString();

function monthsBefore(months: number): string {
  const d = new Date(SEED_DATE);
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

const S = (v: string) => `'${v.replace(/'/g, "''")}'`;
const J = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const T = (iso: string) => `'${iso}'::timestamptz`;
const N = (v: number) => String(v);

function deriveScenarios(spec: BusinessSpec): Record<ScenarioType, ScenarioAssumptions> {
  const c = spec.circular;
  return {
    baseline: baselineAssumptions(spec.baseline),
    circular_base: c,
    upside: {
      ...c,
      revenueDeltaPct: c.revenueDeltaPct + 8,
      materialCostDeltaPct: c.materialCostDeltaPct - 3,
      recurringRevenueSharePct: Math.min(100, c.recurringRevenueSharePct + 8),
      customerRetentionPct: Math.min(100, c.customerRetentionPct + 5),
    },
    downside: {
      ...c,
      revenueDeltaPct: c.revenueDeltaPct - 12,
      materialCostDeltaPct: c.materialCostDeltaPct + 8,
      energyCostDeltaPct: c.energyCostDeltaPct + 6,
      capex: Math.round(c.capex * 1.1),
      customerRetentionPct: Math.max(0, c.customerRetentionPct - 8),
    },
  };
}

const stmts: string[] = [];

const sectorAgg = new Map<
  string,
  { v: number; r: number; i: number; capex: number; n: number; models: Map<string, number> }
>();

for (const spec of BUSINESSES) {
  stmts.push(
    `INSERT INTO organisations (id,name,sector,company_size,region,description,current_operating_model,current_revenue_model,products_services,customer_model,commercial_pressures,created_at) VALUES (${S(spec.id)},${S(spec.name)},${S(spec.sector)},${S(spec.companySize)},${S(spec.region)},${S(spec.description)},${S(spec.currentOperatingModel)},${S(spec.currentRevenueModel)},${S(spec.productsServices)},${S(spec.customerModel)},${S(spec.commercialPressures)},${T(SEED_ISO)});`,
  );

  stmts.push(
    `INSERT INTO assessments (id,organisation_id,title,stage,circular_models,opportunity_summary,commercial_rationale,inputs,baseline,created_at,updated_at) VALUES (${S(spec.id)},${S(spec.id)},${S(`${spec.name} — circular opportunity assessment`)},${S(spec.stage)},${J(spec.circularModels)},${S(spec.opportunitySummary)},${S(spec.commercialRationale)},${J(spec.inputs)},${J(spec.baseline)},${T(SEED_ISO)},${T(SEED_ISO)});`,
  );

  const bundle = computeScores(spec.inputs, SEED_ISO);
  const headline = headlineScore(bundle);
  stmts.push(
    `INSERT INTO scores (assessment_id,headline,viability,resilience,investor,opportunity,evidence,calculated_at) VALUES (${S(spec.id)},${N(headline)},${N(bundle.viability.score)},${N(bundle.resilience.score)},${N(bundle.investor.score)},${N(bundle.opportunity.score)},${N(bundle.evidence.score)},${T(SEED_ISO)});`,
  );

  const scenarios = deriveScenarios(spec);
  for (const type of Object.keys(scenarios) as ScenarioType[]) {
    stmts.push(
      `INSERT INTO financial_scenarios (assessment_id,scenario_type,label,assumptions,updated_at) VALUES (${S(spec.id)},${S(type)},${S(SCENARIO_LABELS[type])},${J(scenarios[type])},${T(SEED_ISO)});`,
    );
  }

  for (const ev of spec.evidence) {
    stmts.push(
      `INSERT INTO evidence_items (assessment_id,type,description,source,confidence,linked_area,status,date_recorded) VALUES (${S(spec.id)},${S(ev.type)},${S(ev.description)},${S(ev.source)},${N(ev.confidence)},${S(ev.linkedArea)},${S(ev.status)},${T(monthsBefore(ev.agedMonths))});`,
    );
  }

  for (const r of generateRecommendations(spec.inputs, bundle)) {
    stmts.push(
      `INSERT INTO recommendations (assessment_id,code,title,rationale,priority,category) VALUES (${S(spec.id)},${S(r.code)},${S(r.title)},${S(r.rationale)},${S(r.priority)},${S(r.category)});`,
    );
  }

  for (const rd of spec.resourceDeps) {
    stmts.push(
      `INSERT INTO resource_dependencies (organisation_id,material,criticality,annual_spend,volatility,notes) VALUES (${S(spec.id)},${S(rd.material)},${S(rd.criticality)},${N(rd.annualSpend)},${S(rd.volatility)},${S(rd.notes)});`,
    );
  }
  for (const sr of spec.supplierRisks) {
    stmts.push(
      `INSERT INTO supplier_risks (organisation_id,supplier,category,share_of_supply_pct,region,risk_level) VALUES (${S(spec.id)},${S(sr.supplier)},${S(sr.category)},${N(sr.shareOfSupplyPct)},${S(sr.region)},${S(sr.riskLevel)});`,
    );
  }

  stmts.push(
    `INSERT INTO audit_events (action,entity_type,entity_id,actor,detail,created_at) VALUES ('assessment.seeded','assessment',${S(spec.id)},'seed-script',${S(`Seeded assessment for ${spec.name} with headline score ${headline}.`)},${T(SEED_ISO)});`,
  );

  const agg =
    sectorAgg.get(spec.sector) ??
    { v: 0, r: 0, i: 0, capex: 0, n: 0, models: new Map<string, number>() };
  agg.v += bundle.viability.score;
  agg.r += bundle.resilience.score;
  agg.i += bundle.investor.score;
  agg.capex += spec.inputs.capexRequirement;
  agg.n += 1;
  for (const m of spec.circularModels) agg.models.set(m, (agg.models.get(m) ?? 0) + 1);
  sectorAgg.set(spec.sector, agg);
}

for (const [sector, agg] of sectorAgg) {
  const commonModel = [...agg.models.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  stmts.push(
    `INSERT INTO sector_benchmarks (sector,avg_viability,avg_resilience,avg_investor,avg_capex_requirement,common_model) VALUES (${S(sector)},${N(Math.round((agg.v / agg.n) * 10) / 10)},${N(Math.round((agg.r / agg.n) * 10) / 10)},${N(Math.round((agg.i / agg.n) * 10) / 10)},${N(Math.round(agg.capex / agg.n))},${S(commonModel)});`,
  );
}

for (const pi of PROGRAMME_INSIGHTS) {
  stmts.push(
    `INSERT INTO programme_insights (metric,category,value,unit,note) VALUES (${S(pi.metric)},${S(pi.category)},${N(pi.value)},${S(pi.unit)},${S(pi.note)});`,
  );
}

const out = process.argv[2] ?? "./seed-sql.json";
writeFileSync(out, JSON.stringify(stmts, null, 0));
console.log(`Wrote ${stmts.length} statements to ${out}`);
