"use client";

import * as React from "react";
import { Save, RotateCcw, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScenarioComparison } from "@/components/charts";
import { formatGBP, formatGBPCompact, formatPct, formatPayback } from "@/lib/format";
import {
  computeScenarioSet,
  type FinancialBaseline,
  type ScenarioAssumptions,
} from "@/domain/scenarios/model";
import { runSensitivity } from "@/domain/scenarios/sensitivity";
import { SCENARIO_LABELS, SCENARIO_TYPES, type ScenarioType } from "@/domain/constants";
import { updateScenarioAction } from "@/server/actions";

interface Props {
  assessmentId: string;
  baseline: FinancialBaseline;
  initial: Record<ScenarioType, ScenarioAssumptions>;
}

const LEVERS: {
  key: keyof ScenarioAssumptions;
  label: string;
  kind: "pct" | "money" | "share";
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "revenueDeltaPct", label: "Revenue change", kind: "pct", min: -40, max: 60, step: 1 },
  { key: "materialCostDeltaPct", label: "Material cost change", kind: "pct", min: -40, max: 40, step: 1 },
  { key: "energyCostDeltaPct", label: "Energy / resource cost change", kind: "pct", min: -40, max: 60, step: 1 },
  { key: "labourCostDeltaPct", label: "Labour cost change", kind: "pct", min: -30, max: 40, step: 1 },
  { key: "opexDeltaPct", label: "Other opex change", kind: "pct", min: -30, max: 40, step: 1 },
  { key: "maintenanceDeltaPct", label: "Maintenance cost change", kind: "pct", min: -30, max: 60, step: 1 },
  { key: "recurringRevenueSharePct", label: "Recurring revenue share", kind: "share", min: 0, max: 100, step: 1 },
  { key: "customerRetentionPct", label: "Customer retention", kind: "share", min: 0, max: 100, step: 1 },
  { key: "capex", label: "Capital expenditure", kind: "money", min: 0, max: 5_000_000, step: 5000 },
  { key: "workingCapitalDelta", label: "Working-capital change", kind: "money", min: -500_000, max: 1_000_000, step: 5000 },
  { key: "residualValue", label: "Residual / resale value", kind: "money", min: 0, max: 2_000_000, step: 5000 },
];

export function ScenarioModeller({ assessmentId, baseline, initial }: Props) {
  const [assumptions, setAssumptions] = React.useState(initial);
  const [active, setActive] = React.useState<ScenarioType>("circular_base");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const set = computeScenarioSet(baseline, assumptions);
  const activeAssumptions = assumptions[active];
  const dirty = JSON.stringify(assumptions[active]) !== JSON.stringify(initial[active]);

  const sensitivity = runSensitivity(
    baseline,
    activeAssumptions,
    set.baseline.ebitda,
  );

  function update(key: keyof ScenarioAssumptions, value: number) {
    setAssumptions((prev) => ({ ...prev, [active]: { ...prev[active], [key]: value } }));
    setSaved(false);
  }

  function reset() {
    setAssumptions((prev) => ({ ...prev, [active]: initial[active] }));
    setSaved(false);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await updateScenarioAction({
      assessmentId,
      scenarioType: active,
      assumptions: activeAssumptions,
    });
    setSaving(false);
    setSaved(res.ok);
    setMessage(res.message);
    if (res.ok) initial[active] = { ...activeAssumptions };
  }

  const ebitdaChart = SCENARIO_TYPES.map((t) => ({ name: shortLabel(t), value: set[t].ebitda }));
  const paybackChart = SCENARIO_TYPES.filter((t) => t !== "baseline").map((t) => ({
    name: shortLabel(t),
    value: set[t].paybackYears ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Scenario comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario comparison</CardTitle>
          <CardDescription>All figures are annual unless noted. Edit the highlighted scenario below and see every output update.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                {SCENARIO_TYPES.map((t) => (
                  <TableHead key={t} className={`text-right ${t === active ? "text-evergreen-600" : ""}`}>
                    {shortLabel(t)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <Row label="Revenue" fmt={formatGBPCompact} vals={SCENARIO_TYPES.map((t) => set[t].revenue)} active={active} />
              <Row label="Gross margin" fmt={(v) => formatPct(v)} vals={SCENARIO_TYPES.map((t) => set[t].grossMarginPct)} active={active} />
              <Row label="EBITDA" fmt={formatGBPCompact} vals={SCENARIO_TYPES.map((t) => set[t].ebitda)} active={active} />
              <Row label="EBITDA margin" fmt={(v) => formatPct(v)} vals={SCENARIO_TYPES.map((t) => set[t].ebitdaMarginPct)} active={active} />
              <Row label="Recurring revenue" fmt={formatGBPCompact} vals={SCENARIO_TYPES.map((t) => set[t].recurringRevenue)} active={active} />
              <Row label="EBITDA uplift vs baseline" fmt={formatGBPCompact} vals={SCENARIO_TYPES.map((t) => set[t].annualBenefitVsBaseline)} active={active} />
              <Row label="Capital requirement" fmt={formatGBPCompact} vals={SCENARIO_TYPES.map((t) => set[t].capex)} active={active} />
              <Row label="Cash requirement" fmt={formatGBPCompact} vals={SCENARIO_TYPES.map((t) => set[t].cashRequirement)} active={active} />
              <Row label="Simple payback" fmt={(v) => (v ? formatPayback(v) : "—")} vals={SCENARIO_TYPES.map((t) => set[t].paybackYears ?? 0)} active={active} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>EBITDA by scenario</CardTitle></CardHeader>
          <CardContent><ScenarioComparison data={ebitdaChart} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payback by scenario (years)</CardTitle></CardHeader>
          <CardContent><ScenarioComparison data={paybackChart} unit=" yr" /></CardContent>
        </Card>
      </div>

      {/* Editor */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Assumptions</CardTitle>
              <CardDescription>Adjust the levers; values recalculate instantly. Save to persist.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SCENARIO_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => { setActive(t); setSaved(false); setMessage(null); }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active === t
                      ? "bg-evergreen-700 text-white"
                      : "border border-border text-muted-foreground hover:bg-charcoal-50 dark:hover:bg-charcoal-800"
                  }`}
                >
                  {SCENARIO_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {active === "baseline" && (
            <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              The current baseline represents today&apos;s position and normally stays at zero change. Editing it is allowed but rarely needed.
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
            {LEVERS.map((lever) => (
              <Lever
                key={lever.key}
                lever={lever}
                value={activeAssumptions[lever.key]}
                onChange={(v) => update(lever.key, v)}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved && !dirty ? "Saved" : "Save scenario"}
            </Button>
            <Button variant="outline" onClick={reset} disabled={!dirty}>
              <RotateCcw className="h-4 w-4" /> Reset changes
            </Button>
            {dirty && <Badge variant="warn">Unsaved changes</Badge>}
            {message && <span className="text-xs text-muted-foreground">{message}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity */}
      <Card>
        <CardHeader>
          <CardTitle>Sensitivity analysis</CardTitle>
          <CardDescription>How the edited scenario&apos;s outputs respond to single-variable shocks</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shock</TableHead>
                <TableHead className="text-right">EBITDA</TableHead>
                <TableHead className="text-right">Δ EBITDA</TableHead>
                <TableHead className="text-right">Gross margin</TableHead>
                <TableHead className="text-right">Payback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-foreground">Edited scenario (no shock)</TableCell>
                <TableCell className="text-right tabular-nums">{formatGBP(sensitivity.base.ebitda)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">—</TableCell>
                <TableCell className="text-right tabular-nums">{formatPct(sensitivity.base.grossMarginPct)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPayback(sensitivity.base.paybackYears)}</TableCell>
              </TableRow>
              {sensitivity.rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="text-foreground">{r.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatGBP(r.ebitda)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${r.ebitdaDelta >= 0 ? "text-evergreen-600" : "text-red-500"}`}>
                    {r.ebitdaDelta >= 0 ? "+" : ""}{formatGBPCompact(r.ebitdaDelta)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatPct(r.grossMarginPct)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPayback(r.paybackYears)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function shortLabel(t: ScenarioType): string {
  return { baseline: "Baseline", circular_base: "Circular", upside: "Upside", downside: "Downside" }[t];
}

function Row({
  label,
  vals,
  fmt,
  active,
}: {
  label: string;
  vals: number[];
  fmt: (n: number) => string;
  active: ScenarioType;
}) {
  const activeIdx = SCENARIO_TYPES.indexOf(active);
  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{label}</TableCell>
      {vals.map((v, i) => (
        <TableCell key={i} className={`text-right tabular-nums ${i === activeIdx ? "font-semibold text-foreground" : ""}`}>
          {fmt(v)}
        </TableCell>
      ))}
    </TableRow>
  );
}

function Lever({
  lever,
  value,
  onChange,
}: {
  lever: (typeof LEVERS)[number];
  value: number;
  onChange: (v: number) => void;
}) {
  const display =
    lever.kind === "money" ? formatGBP(value) : lever.kind === "pct" ? `${value > 0 ? "+" : ""}${value}%` : `${value}%`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{lever.label}</label>
        <span className="text-xs font-semibold tabular-nums text-evergreen-600">{display}</span>
      </div>
      <input
        type="range"
        min={lever.min}
        max={lever.max}
        step={lever.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-charcoal-200 accent-evergreen-700 dark:bg-charcoal-700"
        aria-label={lever.label}
      />
    </div>
  );
}
