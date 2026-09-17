"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  assessmentSchema,
  sectors,
  models,
  type AssessmentInput,
  type Factors,
  type Baseline,
  type ScenarioInput,
} from "@/lib/validation/assessment";
import { PageHead, gbp } from "@/components/ui/primitives";
import { modelScenario, scoreAssessment } from "@/lib/scoring/commercial";
const initial: AssessmentInput = {
  name: "",
  sector: "Furniture",
  region: "Central Scotland",
  size: "Small",
  businessModel: ["Refurbishment"],
  summary: "",
  operatingModel: "",
  opportunity: "",
  customerEvidence: "",
  resourceDependencies: "",
  barriers: ["Customer evidence"],
  baseline: {
    revenue: 600000,
    material: 180000,
    labour: 150000,
    energy: 36000,
    maintenance: 18000,
    overhead: 105000,
  },
  scenario: {
    revenueChange: 10,
    materialSaving: 30,
    energySaving: 15,
    recurringRevenue: 60000,
    extraLabour: 30000,
    extraOperating: 20000,
    capex: 120000,
    workingCapital: 20000,
    residualValue: 12000,
    retention: 80,
    supplierShock: 5,
  },
  factors: {
    demand: 50,
    market: 50,
    capability: 60,
    readiness: 50,
    supplierConcentration: 60,
    importDependency: 40,
    volatility: 50,
    substitution: 50,
    repairability: 70,
    reuse: 65,
    diversity: 45,
    retention: 80,
    flexibility: 60,
    scalability: 55,
    traction: 40,
    resourceSecurity: 55,
    evidence: 45,
  },
};
const factorLabels: Record<keyof Factors, string> = {
  demand: "Customer-demand evidence",
  market: "Market validation",
  capability: "Team capability",
  readiness: "Implementation readiness",
  supplierConcentration: "Largest supplier concentration",
  importDependency: "Import dependency",
  volatility: "Resource-price volatility",
  substitution: "Substitution potential",
  repairability: "Repairability",
  reuse: "Reuse potential",
  diversity: "Revenue diversity",
  retention: "Baseline customer retention",
  flexibility: "Operating flexibility",
  scalability: "Scalability",
  traction: "Commercial traction",
  resourceSecurity: "Resource security",
  evidence: "Evidence quality",
};
const scenarioLabels: Record<keyof ScenarioInput, string> = {
  revenueChange: "Core revenue change (%)",
  materialSaving: "Material expenditure reduction (%)",
  energySaving: "Energy expenditure reduction (%)",
  recurringRevenue: "Additional recurring revenue (£/year)",
  extraLabour: "Additional labour (£/year)",
  extraOperating: "Additional operating costs (£/year)",
  capex: "Capital expenditure (£)",
  workingCapital: "Working capital (£)",
  residualValue: "Year 3 residual value (£)",
  retention: "Scenario customer retention (%)",
  supplierShock: "Material price shock (%)",
};
export function AssessmentForm() {
  const [step, setStep] = useState(0),
    [data, setData] = useState(initial),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  const titles = [
    "Business & opportunity",
    "Commercial evidence",
    "Financial assumptions",
    "Review & create",
  ];
  const set = <K extends keyof AssessmentInput>(
    key: K,
    value: AssessmentInput[K],
  ) => setData({ ...data, [key]: value });
  function validate() {
    const parsed = assessmentSchema.safeParse(data);
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const e: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      e[issue.path.join(".")] = issue.message;
    setErrors(e);
    return false;
  }
  async function save() {
    if (!validate()) {
      setMessage("Please check the inputs before creating this assessment.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      router.push(`/assessments/${d.id}`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
      setBusy(false);
    }
  }
  function textField(
    key:
      | "name"
      | "summary"
      | "operatingModel"
      | "opportunity"
      | "customerEvidence"
      | "resourceDependencies",
    label: string,
    help: string,
    multiline = true,
  ) {
    return (
      <label className="field" key={key}>
        <span>{label} *</span>
        {multiline ? (
          <textarea
            value={data[key]}
            onChange={(e) => set(key, e.target.value)}
            aria-invalid={!!errors[key]}
            required
          />
        ) : (
          <input
            value={data[key]}
            onChange={(e) => set(key, e.target.value)}
            aria-invalid={!!errors[key]}
            maxLength={100}
            required
          />
        )}
        <small>{help}</small>
        {errors[key] && <span className="error">{errors[key]}</span>}
      </label>
    );
  }
  const f = modelScenario(data.baseline, data.scenario),
    s = scoreAssessment(data.factors, data.baseline, data.scenario);
  return (
    <div style={{ maxWidth: 1050, margin: "auto" }}>
      <PageHead
        eyebrow="NEW ASSESSMENT"
        title="Assess a circular opportunity"
        description="Use fictional business information in this demonstration. Required fields are marked *."
      />
      <div className="steps">
        {titles.map((t, i) => (
          <div
            key={t}
            className={`step ${step === i ? "active" : ""}`}
            aria-current={step === i ? "step" : undefined}
          >
            {String(i + 1).padStart(2, "0")} · {t}
          </div>
        ))}
      </div>
      <section className="panel pad">
        <h2 className="section-label">{titles[step]}</h2>
        {step === 0 && (
          <div className="stack">
            {textField(
              "name",
              "Business name",
              "Fictional business name only.",
              false,
            )}
            <div className="grid3">
              <label className="field">
                <span>Sector *</span>
                <select
                  value={data.sector}
                  onChange={(e) =>
                    set("sector", e.target.value as AssessmentInput["sector"])
                  }
                >
                  {sectors.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Region *</span>
                <select
                  value={data.region}
                  onChange={(e) =>
                    set("region", e.target.value as AssessmentInput["region"])
                  }
                >
                  {[
                    "Central Scotland",
                    "North & Islands",
                    "South Scotland",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Company size *</span>
                <select
                  value={data.size}
                  onChange={(e) =>
                    set("size", e.target.value as AssessmentInput["size"])
                  }
                >
                  {["Micro", "Small", "Medium"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid2">
              {textField(
                "summary",
                "Business summary",
                "Products, customers and current revenue model. Minimum 20 characters.",
              )}
              {textField(
                "operatingModel",
                "Current operating model",
                "Delivery model, cost pressures and operating changes.",
              )}
              {textField(
                "opportunity",
                "Proposed circular intervention",
                "Describe what changes and why it creates commercial value.",
              )}
              {textField(
                "resourceDependencies",
                "Resource and supplier dependencies",
                "Critical materials, suppliers and supply-chain implications.",
              )}
              {textField(
                "customerEvidence",
                "Customer and market evidence",
                "Describe evidence you have, including uncertainty.",
              )}
            </div>
            <fieldset>
              <legend className="small" style={{ marginBottom: 10 }}>
                Circular business models * · select up to five
              </legend>
              <div className="toggle-group">
                {models.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={`toggle ${data.businessModel.includes(m) ? "selected" : ""}`}
                    aria-pressed={data.businessModel.includes(m)}
                    onClick={() =>
                      set(
                        "businessModel",
                        data.businessModel.includes(m)
                          ? data.businessModel.filter((x) => x !== m)
                          : data.businessModel.length < 5
                            ? [...data.businessModel, m]
                            : data.businessModel,
                      )
                    }
                  >
                    {data.businessModel.includes(m) ? "✓ " : ""}
                    {m}
                  </button>
                ))}
              </div>
              {errors.businessModel && (
                <p className="error">{errors.businessModel}</p>
              )}
            </fieldset>
          </div>
        )}
        {step === 1 && (
          <div className="stack">
            <div className="notice">
              Use 0 for no supporting evidence and 100 for strong documented
              evidence. Supplier concentration, import dependency and volatility
              represent exposure, so a higher value is a risk.
            </div>
            <div className="grid3">
              {(Object.keys(factorLabels) as (keyof Factors)[]).map((k) => (
                <label className="field" key={k}>
                  <span>
                    {factorLabels[k]} · {data.factors[k]}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.factors[k]}
                    onChange={(e) =>
                      set("factors", {
                        ...data.factors,
                        [k]: Number(e.target.value),
                      })
                    }
                  />
                  <small>
                    0 to 100 ·{" "}
                    {[
                      "supplierConcentration",
                      "importDependency",
                      "volatility",
                    ].includes(k)
                      ? "higher exposure"
                      : "stronger evidence or capability"}
                  </small>
                </label>
              ))}
            </div>
            <fieldset>
              <legend className="small">Current barriers</legend>
              <div className="toggle-group" style={{ marginTop: 12 }}>
                {(
                  [
                    "Customer evidence",
                    "Capital access",
                    "Supplier concentration",
                    "Operating capacity",
                    "Unit economics",
                    "Skills & capability",
                  ] as const
                ).map((b) => (
                  <button
                    key={b}
                    className={`toggle ${data.barriers.includes(b) ? "selected" : ""}`}
                    aria-pressed={data.barriers.includes(b)}
                    onClick={() =>
                      set(
                        "barriers",
                        data.barriers.includes(b)
                          ? data.barriers.filter((x) => x !== b)
                          : [...data.barriers, b],
                      )
                    }
                  >
                    {b}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}
        {step === 2 && (
          <div className="stack">
            <h3>Current baseline · annual GBP</h3>
            <div className="grid3">
              {(Object.keys(data.baseline) as (keyof Baseline)[]).map((k) => (
                <label className="field" key={k}>
                  <span style={{ textTransform: "capitalize" }}>{k} (£) *</span>
                  <input
                    type="number"
                    min="0"
                    max="1000000000"
                    value={data.baseline[k]}
                    onChange={(e) =>
                      set("baseline", {
                        ...data.baseline,
                        [k]: Number(e.target.value),
                      })
                    }
                  />
                  {errors["baseline." + k] && (
                    <p className="error">{errors["baseline." + k]}</p>
                  )}
                </label>
              ))}
            </div>
            <h3>Circular base case</h3>
            <div className="grid3">
              {(Object.keys(data.scenario) as (keyof ScenarioInput)[]).map(
                (k) => (
                  <label className="field" key={k}>
                    <span>{scenarioLabels[k]} *</span>
                    <input
                      type="number"
                      min={k === "revenueChange" ? -80 : 0}
                      value={data.scenario[k]}
                      onChange={(e) =>
                        set("scenario", {
                          ...data.scenario,
                          [k]: Number(e.target.value),
                        })
                      }
                    />
                    {errors["scenario." + k] && (
                      <p className="error">{errors["scenario." + k]}</p>
                    )}
                  </label>
                ),
              )}
            </div>
            <div className="notice">
              Recurring revenue must be additional to the core revenue change.
              Residual value is counted only in year 3. Estimates exclude
              financing, tax, depreciation and discounting.
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="stack">
            <div className="grid2">
              <div>
                <h3>{data.name}</h3>
                <p className="small muted">
                  {data.sector} · {data.region} · {data.size}
                </p>
                <p style={{ marginTop: 15 }}>{data.opportunity}</p>
                <p className="small muted" style={{ marginTop: 15 }}>
                  {data.businessModel.join(" / ")}
                </p>
              </div>
              <div className="subtle-box">
                <div className="stat-line">
                  <span>Initial cash requirement</span>
                  <strong>{gbp(f.cashRequirement)}</strong>
                </div>
                <div className="stat-line">
                  <span>Annual contribution uplift</span>
                  <strong>{gbp(f.uplift)}</strong>
                </div>
                <div className="stat-line">
                  <span>Prototype viability</span>
                  <strong>{s[0].score}/100</strong>
                </div>
                <div className="stat-line">
                  <span>Evidence confidence</span>
                  <strong>{s[4].score}/100</strong>
                </div>
              </div>
            </div>
            <div className="notice">
              <Check size={18} />
              Creating the assessment saves the business, three financial
              scenarios, evidence descriptions and score explanations in your
              workspace.
            </div>
          </div>
        )}
        {message && (
          <p className="error" role="alert" style={{ marginTop: 15 }}>
            {message}
          </p>
        )}
        <div className="form-footer">
          <button
            className="btn"
            disabled={step === 0 || busy}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <span className="small muted">Step {step + 1} of 4</span>
          {step < 3 ? (
            <button
              className="btn primary"
              onClick={() => {
                if (validate()) {
                  setMessage("");
                  setStep(step + 1);
                } else
                  setMessage("Check the required fields before continuing.");
              }}
            >
              Continue
              <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn primary" disabled={busy} onClick={save}>
              {busy ? "Creating assessment…" : "Create assessment"}
              <Check size={14} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
