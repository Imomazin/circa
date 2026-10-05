"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Building2,
  Recycle,
  Scale,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, InputField } from "@/components/ui/select";
import { ScoreMeter, scoreColor } from "@/components/score";
import { computeScores } from "@/domain/scoring";
import { computeScenario, baselineEbitda } from "@/domain/scenarios/model";
import { NEUTRAL_INPUTS, NEUTRAL_CIRCULAR } from "@/domain/scoring/defaults";
import { formatGBP, formatGBPCompact, formatPct, formatPayback } from "@/lib/format";
import {
  SECTORS,
  COMPANY_SIZES,
  ASSESSMENT_STAGES,
  CIRCULAR_MODELS,
} from "@/domain/constants";
import type { AssessmentInputs } from "@/domain/scoring/types";
import type { FinancialBaseline, ScenarioAssumptions } from "@/domain/scenarios/model";
import { createBusinessAction } from "@/server/actions";
import type { CreateBusinessInput } from "@/lib/validation";

/** The free-text profile fields collected in step 1. */
interface Profile {
  name: string;
  sector: (typeof SECTORS)[number];
  companySize: (typeof COMPANY_SIZES)[number];
  region: string;
  description: string;
  currentOperatingModel: string;
  currentRevenueModel: string;
  productsServices: string;
  customerModel: string;
  commercialPressures: string;
}

const DEFAULT_PROFILE: Profile = {
  name: "",
  sector: SECTORS[0],
  companySize: COMPANY_SIZES[1],
  region: "",
  description: "",
  currentOperatingModel: "",
  currentRevenueModel: "",
  productsServices: "",
  customerModel: "",
  commercialPressures: "",
};

const DEFAULT_BASELINE: FinancialBaseline = {
  revenue: 2_400_000,
  materialCost: 780_000,
  energyCost: 180_000,
  labourCost: 720_000,
  opex: 260_000,
  maintenanceCost: 120_000,
  workingCapital: 340_000,
};

/** Curated scoring inputs surfaced in the wizard. The rest stay at neutral and
 *  can be refined later in the full assessment editor. */
const CURATED: { key: keyof AssessmentInputs; label: string; hint?: string }[] = [
  { key: "marketAttractiveness", label: "Market attractiveness" },
  { key: "customerDemand", label: "Customer demand" },
  { key: "commercialRisk", label: "Commercial risk", hint: "higher = worse" },
  { key: "materialDependency", label: "Material dependency", hint: "higher = worse" },
  { key: "circularRevenueModelStrength", label: "Circular revenue-model strength" },
  { key: "materialRecoveryPotential", label: "Material recovery potential" },
  { key: "commercialTraction", label: "Commercial traction" },
  { key: "managementCapability", label: "Management capability" },
  { key: "evidenceCoverage", label: "Evidence coverage" },
  { key: "evidenceVerification", label: "Verification status" },
];

const STEP_META = [
  { title: "Business profile", icon: Building2 },
  { title: "Circular opportunity", icon: Recycle },
  { title: "Financial baseline", icon: Scale },
  { title: "Circular case", icon: TrendingUp },
  { title: "Commercial signals", icon: Gauge },
];

const BASELINE_FIELDS: { key: keyof FinancialBaseline; label: string }[] = [
  { key: "revenue", label: "Annual revenue" },
  { key: "materialCost", label: "Material cost" },
  { key: "energyCost", label: "Energy / resource cost" },
  { key: "labourCost", label: "Labour cost" },
  { key: "opex", label: "Other operating cost" },
  { key: "maintenanceCost", label: "Maintenance cost" },
  { key: "workingCapital", label: "Working capital" },
];

const CIRCULAR_PCT: { key: keyof ScenarioAssumptions; label: string; hint?: string }[] = [
  { key: "revenueDeltaPct", label: "Revenue change", hint: "% vs baseline" },
  { key: "materialCostDeltaPct", label: "Material-cost change", hint: "% vs baseline" },
  { key: "energyCostDeltaPct", label: "Energy-cost change", hint: "% vs baseline" },
  { key: "labourCostDeltaPct", label: "Labour-cost change", hint: "% vs baseline" },
  { key: "opexDeltaPct", label: "Other-opex change", hint: "% vs baseline" },
  { key: "maintenanceDeltaPct", label: "Maintenance change", hint: "% vs baseline" },
];
const CIRCULAR_MONEY: { key: keyof ScenarioAssumptions; label: string }[] = [
  { key: "capex", label: "Capital investment" },
  { key: "workingCapitalDelta", label: "Working-capital change" },
  { key: "residualValue", label: "Residual / resale value" },
];
const CIRCULAR_SHARE: { key: keyof ScenarioAssumptions; label: string }[] = [
  { key: "recurringRevenueSharePct", label: "Recurring-revenue share" },
  { key: "customerRetentionPct", label: "Customer retention" },
];

export function NewBusinessWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [profile, setProfile] = React.useState<Profile>(DEFAULT_PROFILE);
  const [baseline, setBaseline] = React.useState<FinancialBaseline>(DEFAULT_BASELINE);
  const [circular, setCircular] = React.useState<ScenarioAssumptions>(NEUTRAL_CIRCULAR);
  const [inputs, setInputs] = React.useState<AssessmentInputs>(NEUTRAL_INPUTS);
  const [models, setModels] = React.useState<string[]>(["Reuse"]);
  const [stage, setStage] = React.useState<(typeof ASSESSMENT_STAGES)[number]>("Draft");
  const [opportunitySummary, setOpportunitySummary] = React.useState("");
  const [commercialRationale, setCommercialRationale] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Live scenario + scores from the current wizard state.
  const scenario = React.useMemo(() => computeScenario(baseline, circular), [baseline, circular]);
  const liveInputs = React.useMemo<AssessmentInputs>(
    () => ({
      ...inputs,
      capexRequirement: circular.capex,
      annualRevenueUplift: Math.max(0, Math.round(scenario.revenue - baseline.revenue)),
      annualCostSaving: Math.max(
        0,
        Math.round(
          baseline.materialCost +
            baseline.energyCost +
            baseline.labourCost +
            baseline.opex +
            baseline.maintenanceCost -
            (scenario.cogs + scenario.operatingCosts),
        ),
      ),
      paybackYears: scenario.paybackYears ?? inputs.paybackYears,
    }),
    [inputs, circular, baseline, scenario],
  );
  const bundle = React.useMemo(() => computeScores(liveInputs), [liveInputs]);

  const Meta = STEP_META[step];
  const canProceed = step !== 0 || (profile.name.trim().length > 0 && profile.region.trim().length > 0);
  const narrativeReady =
    opportunitySummary.trim().length >= 1 && commercialRationale.trim().length >= 1 && models.length > 0;

  function toggleModel(m: string) {
    setModels((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function submit() {
    setError(null);
    // Build the full create payload; narrative text fields that are left blank
    // get a sensible deterministic placeholder so validation (min length 1) passes.
    const fallback = (v: string, alt: string) => (v.trim().length > 0 ? v.trim() : alt);
    const payload: CreateBusinessInput = {
      name: profile.name.trim(),
      sector: profile.sector,
      companySize: profile.companySize,
      region: fallback(profile.region, "Scotland"),
      description: fallback(profile.description, `${profile.name.trim()} — ${profile.sector} business.`),
      currentOperatingModel: fallback(profile.currentOperatingModel, "Not yet described."),
      currentRevenueModel: fallback(profile.currentRevenueModel, "Not yet described."),
      productsServices: fallback(profile.productsServices, "Not yet described."),
      customerModel: fallback(profile.customerModel, "Not yet described."),
      commercialPressures: fallback(profile.commercialPressures, "Not yet described."),
      stage,
      circularModels: models as CreateBusinessInput["circularModels"],
      opportunitySummary: fallback(opportunitySummary, "Circular opportunity under assessment."),
      commercialRationale: fallback(commercialRationale, "Commercial rationale under assessment."),
      baseline,
      circular,
      inputs,
    };
    setSubmitting(true);
    const res = await createBusinessAction(payload);
    if (res.ok && res.id) {
      router.push(`/businesses/${res.id}`);
      router.refresh();
    } else {
      setSubmitting(false);
      setError(res.message);
    }
  }

  const dims = [
    { label: "Viability", v: bundle.viability.score },
    { label: "Resilience", v: bundle.resilience.score },
    { label: "Investor", v: bundle.investor.score },
    { label: "Opportunity", v: bundle.opportunity.score },
    { label: "Evidence", v: bundle.evidence.score },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-4">
        {/* Stepper */}
        <div className="flex flex-wrap gap-1.5">
          {STEP_META.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-2xs font-medium transition-colors ${
                i === step
                  ? "bg-evergreen-700 text-white"
                  : "border border-border text-muted-foreground hover:bg-charcoal-50 dark:hover:bg-charcoal-800"
              }`}
            >
              <s.icon className="h-3 w-3" /> {i + 1}. {s.title}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Meta.icon className="h-4 w-4 text-evergreen-600" /> {Meta.title}
            </CardTitle>
            <CardDescription>{STEP_DESCRIPTIONS[step]}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <InputField
                  label="Business name *"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Clyde Remanufacturing Co."
                />
                <InputField
                  label="Region *"
                  value={profile.region}
                  onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))}
                  placeholder="e.g. Glasgow City Region"
                />
                <SelectField
                  label="Sector"
                  value={profile.sector}
                  onChange={(e) => setProfile((p) => ({ ...p, sector: e.target.value as Profile["sector"] }))}
                  options={SECTORS.map((s) => ({ value: s, label: s }))}
                />
                <SelectField
                  label="Company size"
                  value={profile.companySize}
                  onChange={(e) => setProfile((p) => ({ ...p, companySize: e.target.value as Profile["companySize"] }))}
                  options={COMPANY_SIZES.map((s) => ({ value: s, label: s }))}
                />
                <TextArea
                  className="sm:col-span-2"
                  label="What the business does"
                  value={profile.description}
                  onChange={(v) => setProfile((p) => ({ ...p, description: v }))}
                />
                <TextArea
                  label="Current operating model"
                  value={profile.currentOperatingModel}
                  onChange={(v) => setProfile((p) => ({ ...p, currentOperatingModel: v }))}
                />
                <TextArea
                  label="Current revenue model"
                  value={profile.currentRevenueModel}
                  onChange={(v) => setProfile((p) => ({ ...p, currentRevenueModel: v }))}
                />
                <TextArea
                  label="Products & services"
                  value={profile.productsServices}
                  onChange={(v) => setProfile((p) => ({ ...p, productsServices: v }))}
                />
                <TextArea
                  label="Customer model"
                  value={profile.customerModel}
                  onChange={(v) => setProfile((p) => ({ ...p, customerModel: v }))}
                />
                <TextArea
                  className="sm:col-span-2"
                  label="Commercial pressures"
                  value={profile.commercialPressures}
                  onChange={(v) => setProfile((p) => ({ ...p, commercialPressures: v }))}
                />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <SelectField
                    label="Assessment stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value as (typeof ASSESSMENT_STAGES)[number])}
                    options={ASSESSMENT_STAGES.map((s) => ({ value: s, label: s }))}
                  />
                </div>
                <div>
                  <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                    Circular models <span className="text-warmgrey-500">(select at least one)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CIRCULAR_MODELS.map((m) => {
                      const on = models.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => toggleModel(m)}
                          className={`rounded-md px-2.5 py-1 text-2xs font-medium transition-colors ${
                            on
                              ? "bg-evergreen-700 text-white"
                              : "border border-border text-muted-foreground hover:bg-charcoal-50 dark:hover:bg-charcoal-800"
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <TextArea
                  label="Opportunity summary"
                  value={opportunitySummary}
                  onChange={setOpportunitySummary}
                  rows={3}
                />
                <TextArea
                  label="Commercial rationale"
                  value={commercialRationale}
                  onChange={setCommercialRationale}
                  rows={3}
                />
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {BASELINE_FIELDS.map((f) => (
                    <MoneyControl
                      key={f.key}
                      label={f.label}
                      value={baseline[f.key]}
                      onChange={(v) => setBaseline((b) => ({ ...b, [f.key]: v }))}
                    />
                  ))}
                </div>
                <div className="rounded-md border border-border bg-charcoal-50/60 p-3 text-xs dark:bg-charcoal-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Baseline EBITDA (implied)</span>
                    <span className="font-semibold tabular-nums">{formatGBP(baselineEbitda(baseline))}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {CIRCULAR_PCT.map((f) => (
                    <PctControl
                      key={f.key}
                      label={f.label}
                      hint={f.hint}
                      value={circular[f.key]}
                      onChange={(v) => setCircular((c) => ({ ...c, [f.key]: v }))}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {CIRCULAR_MONEY.map((f) => (
                    <MoneyControl
                      key={f.key}
                      label={f.label}
                      allowNegative={f.key === "workingCapitalDelta"}
                      value={circular[f.key]}
                      onChange={(v) => setCircular((c) => ({ ...c, [f.key]: v }))}
                    />
                  ))}
                  {CIRCULAR_SHARE.map((f) => (
                    <RatingControl
                      key={f.key}
                      label={f.label}
                      value={circular[f.key]}
                      onChange={(v) => setCircular((c) => ({ ...c, [f.key]: v }))}
                    />
                  ))}
                </div>
                <ScenarioPreview
                  revenue={scenario.revenue}
                  ebitda={scenario.ebitda}
                  annualBenefit={scenario.annualBenefitVsBaseline}
                  payback={scenario.paybackYears}
                />
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {CURATED.map((f) => (
                  <RatingControl
                    key={String(f.key)}
                    label={f.label}
                    hint={f.hint}
                    value={inputs[f.key]}
                    onChange={(v) => setInputs((p) => ({ ...p, [f.key]: v }))}
                  />
                ))}
                <p className="text-2xs text-muted-foreground sm:col-span-2">
                  These ten signals shape the live scores. All other inputs start at a neutral midpoint and
                  can be refined in the full assessment editor once the business is created.
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <span className="text-2xs text-muted-foreground">
                Step {step + 1} of {STEP_META.length}
              </span>
              {step < STEP_META.length - 1 ? (
                <Button
                  size="sm"
                  disabled={!canProceed}
                  onClick={() => setStep((s) => Math.min(STEP_META.length - 1, s + 1))}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={submit} disabled={submitting || !profile.name.trim() || !narrativeReady}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create business
                </Button>
              )}
            </div>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            {step === STEP_META.length - 1 && !narrativeReady && (
              <p className="mt-3 text-2xs text-warmgrey-500">
                Add an opportunity summary, a commercial rationale and at least one circular model (step 2) before creating.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live scores + headline figures */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Live scores</CardTitle>
            <CardDescription>Recomputed from your inputs by the same engine</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {dims.map((d) => (
              <div key={d.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-foreground">{d.label}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: scoreColor(d.v) }}>
                    {d.v.toFixed(1)}
                  </span>
                </div>
                <ScoreMeter value={d.v} showValue={false} />
              </div>
            ))}
            <div className="mt-1 grid grid-cols-2 gap-2 border-t border-border pt-3 text-2xs">
              <Stat label="Capex" value={formatGBPCompact(circular.capex)} />
              <Stat label="Payback" value={formatPayback(scenario.paybackYears)} />
              <Stat label="Rev. uplift" value={formatGBPCompact(liveInputs.annualRevenueUplift)} />
              <Stat label="Cost saving" value={formatGBPCompact(liveInputs.annualCostSaving)} />
            </div>
            {models.length > 0 && (
              <div className="flex flex-wrap gap-1 border-t border-border pt-3">
                {models.map((m) => (
                  <Badge key={m} variant="outline">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const STEP_DESCRIPTIONS = [
  "Who the business is and how it operates today. Name and region are required; the narrative fields are optional but sharpen the investment case.",
  "The circular opportunity: which models apply, where it sits in the pipeline, and why it makes commercial sense.",
  "The current-state annual P&L. These figures anchor every scenario.",
  "How the circular shift changes revenue, costs and capital. The preview updates live.",
  "The commercial signals that drive the scores. Refine the full set after creation.",
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-charcoal-50/60 px-2 py-1.5 dark:bg-charcoal-800/40">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  className,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  rows?: number;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

function MoneyControl({
  label,
  value,
  onChange,
  allowNegative = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  allowNegative?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-2xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-xs text-muted-foreground">£</span>
        <input
          type="number"
          min={allowNegative ? undefined : 0}
          step={5000}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 w-full rounded-md border border-input bg-card pl-6 pr-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <p className="mt-1 text-2xs text-muted-foreground">{formatGBP(value)}</p>
    </div>
  );
}

function PctControl({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">
          {label}
          {hint && <span className="ml-1 text-2xs font-normal text-warmgrey-500">({hint})</span>}
        </label>
        <span className="text-xs font-semibold tabular-nums text-evergreen-600">{formatPct(value, 0)}</span>
      </div>
      <input
        type="range"
        min={-50}
        max={50}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-charcoal-200 accent-evergreen-700 dark:bg-charcoal-700"
        aria-label={label}
      />
    </div>
  );
}

function RatingControl({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">
          {label}
          {hint && <span className="ml-1 text-2xs font-normal text-warmgrey-500">({hint})</span>}
        </label>
        <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor(value) }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-charcoal-200 accent-evergreen-700 dark:bg-charcoal-700"
        aria-label={label}
      />
    </div>
  );
}

function ScenarioPreview({
  revenue,
  ebitda,
  annualBenefit,
  payback,
}: {
  revenue: number;
  ebitda: number;
  annualBenefit: number;
  payback: number | null;
}) {
  const cells = [
    { label: "Circular revenue", value: formatGBPCompact(revenue) },
    { label: "EBITDA", value: formatGBPCompact(ebitda) },
    { label: "Annual EBITDA gain", value: formatGBPCompact(annualBenefit) },
    { label: "Payback", value: formatPayback(payback) },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-charcoal-50/60 p-3 sm:grid-cols-4 dark:bg-charcoal-800/40">
      {cells.map((c) => (
        <div key={c.label}>
          <p className="text-2xs text-muted-foreground">{c.label}</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
