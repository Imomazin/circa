"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { getAssessment } from "@/lib/services/portfolio";
import { modelScenario, type ScoreFamily } from "@/lib/scoring/commercial";
import { stages } from "@/lib/validation/assessment";
import {
  PageHead,
  Panel,
  Metric,
  Badge,
  gbp,
} from "@/components/ui/primitives";
import { ScoreDialog } from "./score-dialog";
import { ScenarioEditor } from "./scenario-editor";
type Detail = NonNullable<Awaited<ReturnType<typeof getAssessment>>>;
const tabNames = [
  "overview",
  "scenarios",
  "resilience",
  "investor",
  "evidence",
  "investment",
] as const;
export function Detail({ data, tab }: { data: Detail; tab: string }) {
  const { assessment: a, organisation: o, scenarios, evidence, events } = data,
    base =
      scenarios.find((s) => s.name === "Circular base case") ?? scenarios[0],
    input = a.inputs,
    financial = modelScenario(input.baseline, base.inputs),
    scores = base.scores;
  const [explanation, setExplanation] = useState<ScoreFamily | null>(null),
    [stage, setStage] = useState(a.stage),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  const effectiveTab = tabNames.includes(tab as (typeof tabNames)[number])
    ? tab
    : "overview";
  async function progress() {
    setBusy(true);
    try {
      const r = await fetch(`/api/assessments/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stage", stage }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setStatus("Assessment stage saved.");
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  const date = new Date(base.updatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
  function componentPanel(s: ScoreFamily) {
    return (
      <Panel
        title={s.label}
        subtitle={`${s.score}/100 · ${s.band} · ${s.confidence} confidence`}
      >
        <div className="pad">
          {s.components.map((c) => (
            <div className="stat-line" key={c.label}>
              <div>
                <strong>{c.label}</strong>
                <p className="small muted">{c.explanation}</p>
              </div>
              <div className="flex">
                <span className="track">
                  <span style={{ width: c.score + "%" }} />
                </span>
                <strong>{Math.round(c.score)}</strong>
              </div>
            </div>
          ))}
          <button
            className="btn"
            onClick={() => setExplanation(s)}
            style={{ marginTop: 15 }}
          >
            Inspect score and weights <ArrowUpRight size={13} />
          </button>
        </div>
      </Panel>
    );
  }
  return (
    <div>
      <Link
        href="/assessments"
        className="text-link small no-print"
        style={{ marginBottom: 20 }}
      >
        <ArrowLeft size={14} />
        All assessments
      </Link>
      <PageHead
        eyebrow={`${o.sector} · ${o.region} · ${o.size} enterprise`}
        title={o.name}
        description={input.opportunity}
        action={<Badge tone="grey">{a.stage}</Badge>}
      />
      <nav className="tabs" aria-label="Assessment sections">
        {tabNames.map((t) => (
          <Link
            key={t}
            href={`/assessments/${a.id}?tab=${t}`}
            className={`tab ${effectiveTab === t ? "active" : ""}`}
            aria-current={effectiveTab === t ? "page" : undefined}
          >
            {
              {
                overview: "Business overview",
                scenarios: "Financial scenarios",
                resilience: "Resilience",
                investor: "Investor readiness",
                evidence: "Evidence",
                investment: "Investment case",
              }[t]
            }
          </Link>
        ))}
      </nav>
      {effectiveTab === "overview" && (
        <div className="stack">
          <div className="score-grid">
            {scores.map((s) => (
              <button
                className="score-tile"
                key={s.key}
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
          <div className="split">
            <Panel title="Commercial opportunity">
              <div className="pad stack">
                <p className="small muted">{input.summary}</p>
                <div>
                  <h3>Current operating model</h3>
                  <p className="small muted" style={{ marginTop: 8 }}>
                    {input.operatingModel}
                  </p>
                </div>
                <div>
                  <h3>Proposed intervention</h3>
                  <p className="small muted" style={{ marginTop: 8 }}>
                    {input.opportunity}
                  </p>
                  <div
                    className="flex"
                    style={{ marginTop: 12, flexWrap: "wrap" }}
                  >
                    {input.businessModel.map((m) => (
                      <Badge key={m}>{m}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Customer-demand evidence</h3>
                  <p className="small muted" style={{ marginTop: 8 }}>
                    {input.customerEvidence}
                  </p>
                </div>
                <Link
                  className="btn primary"
                  href={`/assessments/${a.id}?tab=scenarios`}
                >
                  Test the financial scenario <ArrowUpRight size={14} />
                </Link>
              </div>
            </Panel>
            <div className="stack">
              <Panel title="Commercial baseline">
                <div className="pad">
                  {Object.entries(input.baseline).map(([k, v]) => (
                    <div className="stat-line" key={k}>
                      <span style={{ textTransform: "capitalize" }}>{k}</span>
                      <strong>{gbp(v)}</strong>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Assessment progression">
                <div className="pad">
                  <label className="field">
                    <span>Current stage</span>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                    >
                      {stages.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="btn"
                    style={{ marginTop: 12 }}
                    disabled={busy}
                    onClick={progress}
                  >
                    Save stage
                  </button>
                  {status && (
                    <p
                      className="small"
                      role="status"
                      style={{ marginTop: 10 }}
                    >
                      {status}
                    </p>
                  )}
                </div>
              </Panel>
            </div>
          </div>
          <div className="notice">
            <Info size={17} />
            <span>
              All scores are prototype decision-support outputs. Click any score
              to see the calculation, evidence gaps and suggested improvements.
            </span>
          </div>
        </div>
      )}
      {effectiveTab === "scenarios" && (
        <ScenarioEditor
          id={a.id}
          baseline={input.baseline}
          factors={input.factors}
          scenarios={scenarios}
        />
      )}
      {effectiveTab === "resilience" && (
        <div className="split">
          {componentPanel(scores.find((s) => s.key === "resilience")!)}
          <div className="stack">
            <Panel title="Resource dependencies">
              <div className="pad">
                <p className="small muted">{input.resourceDependencies}</p>
                <div className="stat-line">
                  <span>Largest supplier exposure</span>
                  <strong>{input.factors.supplierConcentration}%</strong>
                </div>
                <div className="stat-line">
                  <span>Imported input exposure</span>
                  <strong>{input.factors.importDependency}%</strong>
                </div>
                <div className="stat-line">
                  <span>Modelled price shock</span>
                  <strong>{base.inputs.supplierShock}%</strong>
                </div>
              </div>
            </Panel>
            <Panel title="Resilience actions">
              <div className="pad">
                <ul className="list">
                  <li>Qualify a second supplier for critical components.</li>
                  <li>Test recovered-material availability and quality.</li>
                  <li>Validate customer retention and maintenance demand.</li>
                </ul>
                <Link
                  className="btn"
                  href={`/assessments/${a.id}?tab=scenarios`}
                >
                  Test a downside scenario
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      )}
      {effectiveTab === "investor" && (
        <div className="split">
          {componentPanel(scores.find((s) => s.key === "readiness")!)}
          <Panel title="Before approaching funders">
            <div className="pad stack">
              <div>
                <h3>Strengths</h3>
                <ul className="list">
                  {scores[2].positive.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Evidence to secure</h3>
                <ul className="list">
                  {(scores[2].missing.length
                    ? scores[2].missing
                    : ["Independent cost quotations and demand validation"]
                  ).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Funding preparation</h3>
                <ul className="list">
                  <li>
                    Confirm the {gbp(financial.cashRequirement)} cash
                    requirement with quotations.
                  </li>
                  <li>Check the downside case and working-capital buffer.</li>
                  <li>Agree delivery milestones and accountable owners.</li>
                </ul>
              </div>
              <Link
                className="btn primary"
                href={`/assessments/${a.id}?tab=investment`}
              >
                Open investment case
              </Link>
            </div>
          </Panel>
        </div>
      )}
      {effectiveTab === "evidence" && (
        <div className="stack">
          <Panel
            title="Evidence register"
            subtitle="Synthetic evidence descriptions; no uploaded documents or real source verification"
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Evidence item</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Quality</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <strong>{e.title}</strong>
                      </td>
                      <td>{e.category}</td>
                      <td>
                        <Badge tone={e.quality < 60 ? "amber" : ""}>
                          {e.status}
                        </Badge>
                      </td>
                      <td>{e.quality}/100</td>
                      <td className="muted">{e.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Assessment activity">
            <div className="pad timeline">
              {events.length ? (
                events.map((e) => (
                  <article key={e.id}>
                    <h3>{e.action}</h3>
                    <p>{e.detail}</p>
                    <small className="muted">
                      {new Date(e.createdAt).toLocaleString("en-GB", {
                        timeZone: "UTC",
                      })}{" "}
                      · {e.actor}
                    </small>
                  </article>
                ))
              ) : (
                <p className="small muted">
                  No changes yet. Saving a scenario or stage creates an audit
                  event.
                </p>
              )}
            </div>
          </Panel>
        </div>
      )}
      {effectiveTab === "investment" && (
        <div className="investment panel">
          <div className="cover">
            <div className="flex between">
              <p className="eyebrow">CIRCA · INVESTMENT CASE</p>
              <button className="btn no-print" onClick={() => window.print()}>
                <Printer size={14} />
                Print investment case
              </button>
            </div>
            <h1>{o.name}</h1>
            <p>{input.opportunity}</p>
            <p className="small muted" style={{ marginTop: 15 }}>
              Circular base case · revision {base.version} · {date}
            </p>
            <span className="badge grey" style={{ marginTop: 15 }}>
              Synthetic commercial assessment
            </span>
          </div>
          <div className="pad">
            <div className="grid3">
              <Metric
                label="Initial cash requirement"
                value={gbp(financial.cashRequirement, true)}
                note="Capital plus working capital"
              />
              <Metric
                label="Annual contribution uplift"
                value={gbp(financial.uplift, true)}
                note="Compared with current baseline"
              />
              <Metric
                label="Simple payback"
                value={
                  financial.paybackMonths === null
                    ? "Not reached"
                    : `${financial.paybackMonths} months`
                }
                note="Illustrative and undiscounted"
              />
            </div>
            <section>
              <h2>Business and commercial rationale</h2>
              <p className="small muted">{input.summary}</p>
              <p className="small muted" style={{ marginTop: 10 }}>
                {input.customerEvidence}
              </p>
            </section>
            <section>
              <h2>Scenario comparison</h2>
              <table>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Annual contribution</th>
                    <th>Uplift</th>
                    <th>Payback</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Current baseline</td>
                    <td>{gbp(financial.baseProfit)}</td>
                    <td>Reference</td>
                    <td>Not applicable</td>
                  </tr>
                  {scenarios.map((s) => {
                    const f = modelScenario(input.baseline, s.inputs);
                    return (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{gbp(f.profit)}</td>
                        <td>{gbp(f.uplift)}</td>
                        <td>
                          {f.paybackMonths === null
                            ? "Not reached"
                            : `${f.paybackMonths} mo`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
            <section className="grid2">
              <div>
                <h2>Resilience and execution risk</h2>
                <p className="small muted">{input.resourceDependencies}</p>
                <ul className="list">
                  {input.barriers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2>Investment readiness</h2>
                <p className="small muted">
                  {scores[2].score}/100 · {scores[2].band}. Evidence confidence:{" "}
                  {scores[4].score}/100.
                </p>
                <ul className="list">
                  {scores[2].missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </section>
            <section>
              <h2>Key assumptions and decision considerations</h2>
              <ul className="list">
                <li>
                  Core revenue changes by {base.inputs.revenueChange}% with{" "}
                  {gbp(base.inputs.recurringRevenue)} additional annual
                  recurring revenue.
                </li>
                <li>
                  Material expenditure reduces by {base.inputs.materialSaving}%
                  before a {base.inputs.supplierShock}% price shock.
                </li>
                <li>
                  Validate customer commitments, supplier alternatives and
                  independent cost quotations before investment.
                </li>
                <li>
                  Figures exclude tax, financing, depreciation and discounting.
                  Working capital is not released within the three-year horizon.
                </li>
              </ul>
            </section>
            <section className="notice">
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>
                Prepared by Circa for human review. All data is synthetic. This
                prototype is not an investment recommendation or a validated
                investor rating.
                <br />
                Ambidexters × The DataKirk · CivTech Round 12 Product
                Demonstrator
              </span>
            </section>
          </div>
        </div>
      )}
      <ScoreDialog
        score={explanation}
        date={date}
        onClose={() => setExplanation(null)}
      />
    </div>
  );
}
