"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Info } from "lucide-react";
import type {
  Baseline,
  Factors,
  ScenarioInput,
} from "@/lib/validation/assessment";
import { scenarioSchema } from "@/lib/validation/assessment";
import {
  modelScenario,
  scoreAssessment,
  type ScoreFamily,
} from "@/lib/scoring/commercial";
import { CashflowChart } from "@/components/charts/charts";
import { Panel, Metric, gbp } from "@/components/ui/primitives";
import { ScoreDialog } from "./score-dialog";
type Scenario = {
  id: string;
  name: string;
  inputs: ScenarioInput;
  version: number;
  updatedAt: Date;
  scores: ScoreFamily[];
};
export function ScenarioEditor({
  id,
  baseline,
  factors,
  scenarios,
}: {
  id: string;
  baseline: Baseline;
  factors: Factors;
  scenarios: Scenario[];
}) {
  const [chosen, setChosen] = useState(
    scenarios.find((s) => s.name === "Circular base case") ?? scenarios[0],
  );
  const [input, setInput] = useState(chosen.inputs),
    [version, setVersion] = useState(chosen.version),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [explanation, setExplanation] = useState<ScoreFamily | null>(null),
    [saved, setSaved] = useState(true);
  const router = useRouter(),
    result = modelScenario(baseline, input),
    scores = scoreAssessment(factors, baseline, input);
  function change(k: keyof ScenarioInput, n: number) {
    setInput({ ...input, [k]: n });
    setSaved(false);
    setMessage("");
  }
  async function save() {
    setError("");
    const parsed = scenarioSchema.safeParse(input);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((e) => e.path.join(".") + ": " + e.message)
          .join("\n"),
      );
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: chosen.id, version, input }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setVersion(d.version);
      setChosen({
        ...chosen,
        inputs: input,
        version: d.version,
        updatedAt: new Date(d.updatedAt),
      });
      setSaved(true);
      setMessage("Scenario saved. Scores and investment case updated.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  const fields: [keyof ScenarioInput, string, string][] = [
    [
      "revenueChange",
      "Core revenue change",
      "% vs current baseline; excludes additional recurring revenue",
    ],
    [
      "materialSaving",
      "Material expenditure reduction",
      "% before supplier-price shock",
    ],
    ["energySaving", "Energy expenditure reduction", "% vs baseline"],
    [
      "recurringRevenue",
      "Additional recurring revenue",
      "£ / year; excluded from core revenue change",
    ],
    ["extraLabour", "Additional labour", "£ / year"],
    ["extraOperating", "Additional operating cost", "£ / year"],
    ["capex", "Capital expenditure", "£ one-off"],
    ["workingCapital", "Additional working capital", "£ initially tied up"],
    ["residualValue", "Residual value at year 3", "£; cannot exceed capex"],
    [
      "retention",
      "Customer retention assumption",
      "% for resilience scoring; no automatic revenue adjustment",
    ],
    ["supplierShock", "Material price shock", "% after material savings"],
  ];
  return (
    <div className="stack">
      <div className="flex between" style={{ flexWrap: "wrap" }}>
        <div className="toggle-group">
          {scenarios.map((s) => (
            <button
              className={`toggle ${chosen.id === s.id ? "selected" : ""}`}
              key={s.id}
              onClick={() => {
                setChosen(s);
                setInput(s.inputs);
                setVersion(s.version);
                setMessage("");
                setError("");
                setSaved(true);
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
        <span className="small muted">
          {saved ? `Saved revision ${version}` : "Unsaved calculation"}
        </span>
      </div>
      <div className="grid4">
        <Metric
          label="Annual contribution uplift"
          value={gbp(result.uplift, true)}
          note="Circular minus baseline operating contribution"
        />
        <Metric
          label="Simple payback"
          value={
            result.paybackMonths === null
              ? "Not reached"
              : `${result.paybackMonths} mo`
          }
          note="Capex and working capital / annual uplift"
        />
        <Metric
          label="Initial cash requirement"
          value={gbp(result.cashRequirement, true)}
          note="Capital expenditure plus working capital"
        />
        <Metric
          label="Commercial viability"
          value={`${scores[0].score}/100`}
          note={`${scores[0].band} · recalculated from inputs`}
        />
      </div>
      <div className="split">
        <Panel
          title="Financial assumptions"
          subtitle="Change an assumption to preview the effect. Save to persist."
        >
          <div className="pad">
            <div className="grid2">
              {fields.map(([k, label, help]) => (
                <label className="field" key={k}>
                  <span>{label}</span>
                  <input
                    type="number"
                    value={input[k]}
                    onChange={(e) =>
                      change(
                        k,
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                    min={k === "revenueChange" ? -80 : 0}
                    max={
                      [
                        "revenueChange",
                        "materialSaving",
                        "energySaving",
                        "retention",
                        "supplierShock",
                      ].includes(k)
                        ? 100
                        : 1000000000
                    }
                    step={
                      [
                        "revenueChange",
                        "materialSaving",
                        "energySaving",
                        "retention",
                        "supplierShock",
                      ].includes(k)
                        ? 1
                        : 100
                    }
                  />
                  <small>{help}</small>
                </label>
              ))}
            </div>
            <div className="form-footer">
              <button className="btn primary" disabled={busy} onClick={save}>
                <Save size={14} />
                {busy ? "Saving…" : "Save scenario"}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setInput(chosen.inputs);
                  setSaved(true);
                  setError("");
                  setMessage("Draft restored to last loaded values.");
                }}
              >
                Discard edits
              </button>
            </div>
            {error && (
              <p className="error" role="alert" style={{ marginTop: 12 }}>
                {error}
              </p>
            )}
            {message && (
              <p className="success" role="status" style={{ marginTop: 12 }}>
                {message}
              </p>
            )}
          </div>
        </Panel>
        <div className="stack">
          <Panel
            title="Cumulative cash contribution"
            subtitle="Three years · GBP · undiscounted"
          >
            <CashflowChart data={result.cashflow} />
            <p className="chart-caption">
              Circular model includes initial cash requirement and year 3
              residual value. Tax, financing and depreciation excluded.
            </p>
          </Panel>
          <Panel title="Baseline vs circular model">
            <div className="pad">
              <table>
                <thead>
                  <tr>
                    <th>Annual</th>
                    <th>Baseline</th>
                    <th>Circular</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Revenue</td>
                    <td>{gbp(result.baseRevenue)}</td>
                    <td>{gbp(result.revenue)}</td>
                  </tr>
                  <tr>
                    <td>Operating costs</td>
                    <td>{gbp(result.baseCosts)}</td>
                    <td>{gbp(result.costs)}</td>
                  </tr>
                  <tr>
                    <td>Contribution</td>
                    <td>{gbp(result.baseProfit)}</td>
                    <td>{gbp(result.profit)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="stat-line">
                <span>Three-year incremental value</span>
                <strong>{gbp(result.threeYearNetValue)}</strong>
              </div>
            </div>
          </Panel>
          <div className="notice">
            <Info size={17} style={{ flexShrink: 0 }} />
            <span>
              These are illustrative commercial estimates. Retention affects the
              resilience score only. All figures need external validation.
            </span>
          </div>
        </div>
      </div>
      <div className="score-grid">
        {scores.map((s) => (
          <button
            key={s.key}
            className="score-tile"
            onClick={() => setExplanation(s)}
          >
            <small>{s.label}</small>
            <strong>
              {s.score}
              <span style={{ fontSize: 12, color: "#7c887d" }}>/100</span>
            </strong>
            <span className="small muted">{s.band} ↗</span>
          </button>
        ))}
      </div>
      <ScoreDialog
        score={explanation}
        date={
          saved
            ? new Date(chosen.updatedAt).toLocaleDateString("en-GB", {
                timeZone: "UTC",
              })
            : "Unsaved preview"
        }
        onClose={() => setExplanation(null)}
      />
    </div>
  );
}
