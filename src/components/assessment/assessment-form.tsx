"use client";

import * as React from "react";
import { Save, Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreMeter, scoreColor } from "@/components/score";
import { computeScores } from "@/domain/scoring";
import { formatGBP } from "@/lib/format";
import type { AssessmentInputs } from "@/domain/scoring/types";
import { updateAssessmentInputsAction } from "@/server/actions";

type FieldKind = "rating" | "money" | "years";
interface Field {
  key: keyof AssessmentInputs;
  label: string;
  kind?: FieldKind;
  hint?: string;
}
interface Step {
  title: string;
  description: string;
  fields: Field[];
}

const STEPS: Step[] = [
  {
    title: "Market & demand",
    description: "Strength of the market pull behind the circular opportunity.",
    fields: [
      { key: "marketAttractiveness", label: "Market attractiveness" },
      { key: "customerDemand", label: "Customer demand" },
      { key: "revenuePotential", label: "Revenue potential" },
      { key: "marginPotential", label: "Margin potential" },
      { key: "scalability", label: "Scalability" },
      { key: "operationalFeasibility", label: "Operational feasibility" },
    ],
  },
  {
    title: "Capital & returns",
    description: "The money in, the money out, and the risk around it.",
    fields: [
      { key: "capexRequirement", label: "Capital requirement", kind: "money" },
      { key: "annualRevenueUplift", label: "Annual revenue uplift", kind: "money" },
      { key: "annualCostSaving", label: "Annual cost saving", kind: "money" },
      { key: "paybackYears", label: "Expected payback (years)", kind: "years" },
      { key: "commercialRisk", label: "Commercial risk", hint: "Higher = more risk" },
      { key: "resourceExposure", label: "Resource exposure", hint: "Higher = more exposed" },
    ],
  },
  {
    title: "Resource & supply resilience",
    description: "Exposure to supply, material and resource-price shocks.",
    fields: [
      { key: "supplierConcentration", label: "Supplier concentration", hint: "Higher = worse" },
      { key: "materialDependency", label: "Material dependency", hint: "Higher = worse" },
      { key: "importExposure", label: "Import exposure", hint: "Higher = worse" },
      { key: "resourcePriceVolatility", label: "Resource-price volatility", hint: "Higher = worse" },
      { key: "substitutionOptions", label: "Substitution options" },
      { key: "repairability", label: "Repairability" },
      { key: "reuseOpportunity", label: "Reuse opportunity" },
    ],
  },
  {
    title: "Revenue resilience",
    description: "How durable and diversified the revenue is.",
    fields: [
      { key: "revenueDiversity", label: "Revenue diversity" },
      { key: "recurringRevenueShare", label: "Recurring revenue share" },
      { key: "customerRetention", label: "Customer retention" },
      { key: "operationalFlexibility", label: "Operational flexibility" },
    ],
  },
  {
    title: "Circular opportunity",
    description: "The strength of the underlying circular-economy opportunity.",
    fields: [
      { key: "materialRecoveryPotential", label: "Material recovery potential" },
      { key: "lifetimeExtensionPotential", label: "Lifetime extension potential" },
      { key: "circularRevenueModelStrength", label: "Circular revenue-model strength" },
      { key: "supplyChainBenefit", label: "Supply-chain benefit" },
      { key: "resourceSecurityBenefit", label: "Resource-security benefit" },
      { key: "circularPropositionClarity", label: "Circular proposition clarity" },
    ],
  },
  {
    title: "Investor readiness",
    description: "How fundable the opportunity is today.",
    fields: [
      { key: "customerEvidence", label: "Customer evidence" },
      { key: "marketValidation", label: "Market validation" },
      { key: "commercialTraction", label: "Commercial traction" },
      { key: "unitEconomics", label: "Unit economics" },
      { key: "managementCapability", label: "Management capability" },
      { key: "operatingCapability", label: "Operating capability" },
      { key: "capitalClarity", label: "Capital-requirement clarity" },
      { key: "riskUnderstanding", label: "Risk understanding" },
      { key: "dataQuality", label: "Data quality" },
    ],
  },
  {
    title: "Evidence quality & review",
    description: "How much weight decision-makers can place on the scores.",
    fields: [
      { key: "evidenceCoverage", label: "Evidence coverage" },
      { key: "evidenceRecency", label: "Evidence recency" },
      { key: "evidenceIndependence", label: "Source independence" },
      { key: "evidenceVerification", label: "Verification status" },
    ],
  },
];

export function AssessmentForm({
  assessmentId,
  businessName,
  initial,
}: {
  assessmentId: string;
  businessName: string;
  initial: AssessmentInputs;
}) {
  const [inputs, setInputs] = React.useState<AssessmentInputs>(initial);
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const bundle = computeScores(inputs);
  const dirty = JSON.stringify(inputs) !== JSON.stringify(initial);
  const current = STEPS[step];

  function set(key: keyof AssessmentInputs, value: number) {
    setInputs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await updateAssessmentInputsAction({ assessmentId, inputs });
    setSaving(false);
    setSaved(res.ok);
    setMessage(res.message);
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
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={`rounded-md px-2.5 py-1 text-2xs font-medium transition-colors ${
                i === step
                  ? "bg-evergreen-700 text-white"
                  : "border border-border text-muted-foreground hover:bg-charcoal-50 dark:hover:bg-charcoal-800"
              }`}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{current.title}</CardTitle>
            <CardDescription>{current.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {current.fields.map((f) => (
                <FieldControl key={String(f.key)} field={f} value={inputs[f.key]} onChange={(v) => set(f.key, v)} />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <span className="text-2xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
              {step < STEPS.length - 1 ? (
                <Button size="sm" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={save} disabled={saving || !dirty}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {saved && !dirty ? "Saved" : "Save assessment"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live scores */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Live scores</CardTitle>
            <CardDescription>Recomputed as you edit — {businessName}</CardDescription>
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
            <div className="mt-1 border-t border-border pt-3">
              <Button className="w-full" onClick={save} disabled={saving || !dirty}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save assessment
              </Button>
              {dirty && <Badge variant="warn" className="mt-2">Unsaved changes</Badge>}
              {message && <p className="mt-2 text-2xs text-muted-foreground">{message}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: number;
  onChange: (v: number) => void;
}) {
  if (field.kind === "money") {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">{field.label}</label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-xs text-muted-foreground">£</span>
          <input
            type="number"
            min={0}
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
  if (field.kind === "years") {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">{field.label}</label>
          <span className="text-xs font-semibold tabular-nums text-evergreen-600">{value.toFixed(1)} yr</span>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          step={0.1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-charcoal-200 accent-evergreen-700 dark:bg-charcoal-700"
          aria-label={field.label}
        />
      </div>
    );
  }
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">
          {field.label}
          {field.hint && <span className="ml-1 text-2xs font-normal text-warmgrey-500">({field.hint})</span>}
        </label>
        <span className="text-xs font-semibold tabular-nums" style={{ color: scoreColor(value) }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-charcoal-200 accent-evergreen-700 dark:bg-charcoal-700"
        aria-label={field.label}
      />
    </div>
  );
}
