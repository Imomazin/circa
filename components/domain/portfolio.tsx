"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type { PortfolioRow } from "@/lib/services/portfolio";
import { sectors, models, stages } from "@/lib/validation/assessment";
import {
  gbp,
  Metric,
  PageHead,
  Panel,
  Badge,
} from "@/components/ui/primitives";
import { ComparisonChart } from "@/components/charts/charts";
export function Portfolio({
  rows,
  view = "overview",
}: {
  rows: PortfolioRow[];
  view?: "overview" | "assessments" | "analytics" | "programme";
}) {
  const [sector, setSector] = useState("All sectors"),
    [model, setModel] = useState("All models"),
    [stage, setStage] = useState("All stages"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("viability"),
    [page, setPage] = useState(0),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const filtered = rows.filter(
    (r) =>
      (sector === "All sectors" || r.organisation.sector === sector) &&
      (model === "All models" ||
        r.assessment.inputs.businessModel.includes(
          model as (typeof models)[number],
        )) &&
      (stage === "All stages" || r.assessment.stage === stage) &&
      r.organisation.name.toLowerCase().includes(query.toLowerCase()) &&
      (!from || new Date(r.assessment.createdAt) >= new Date(from)) &&
      (!to ||
        new Date(r.assessment.createdAt) < new Date(to + "T23:59:59.999Z")),
  );
  const n = filtered.length,
    score = (r: PortfolioRow, key: string) =>
      r.scenario.scores.find((s) => s.key === key)?.score ?? 0,
    avg = (key: string) =>
      n ? Math.round(filtered.reduce((s, r) => s + score(r, key), 0) / n) : 0;
  const sorted = [...filtered].sort((a, b) =>
    sort === "name"
      ? a.organisation.name.localeCompare(b.organisation.name)
      : sort === "capital"
        ? b.financial.cashRequirement - a.financial.cashRequirement
        : score(b, "viability") - score(a, "viability"),
  );
  const active = filtered.filter(
      (r) => r.assessment.stage !== "Discovery",
    ).length,
    strong = filtered.filter((r) => score(r, "viability") >= 75).length;
  const chart = Array.from(new Set(filtered.map((r) => r.organisation.sector)))
    .map((s) => {
      const group = filtered.filter((r) => r.organisation.sector === s);
      return {
        name:
          s === "Equipment rental"
            ? "Equipment"
            : s === "Industrial services"
              ? "Industrial"
              : s === "Consumer goods"
                ? "Consumer"
                : s,
        viability: Math.round(
          group.reduce((a, r) => a + score(r, "viability"), 0) / group.length,
        ),
        readiness: Math.round(
          group.reduce((a, r) => a + score(r, "readiness"), 0) / group.length,
        ),
      };
    })
    .slice(0, 6);
  const barriers = Array.from(
    new Set(filtered.flatMap((r) => r.assessment.inputs.barriers)),
  )
    .map((b) => ({
      name: b,
      count: filtered.filter((r) => r.assessment.inputs.barriers.includes(b))
        .length,
    }))
    .sort((a, b) => b.count - a.count);
  const title = {
    overview: "Portfolio overview",
    assessments: "Business assessments",
    analytics: "Commercial analytics",
    programme: "Programme intelligence",
  }[view];
  const descriptions = {
    overview:
      "Commercial potential, capital needs and evidence across the portfolio.",
    assessments:
      "Review opportunities, compare commercial strength and progress the investment case.",
    analytics:
      "Compare opportunity quality, resilience and evidence across the current cohort.",
    programme:
      "Aggregated synthetic insight for programme design and business support.",
  };
  function clear() {
    setSector("All sectors");
    setModel("All models");
    setStage("All stages");
    setQuery("");
    setFrom("");
    setTo("");
    setPage(0);
  }
  return (
    <div>
      <PageHead
        eyebrow={
          view === "programme"
            ? "PROGRAMME VIEW · AGGREGATED"
            : "SEPTEMBER 2026 · SYNTHETIC COHORT"
        }
        title={title}
        description={descriptions[view]}
        action={
          <Link href="/assessments/new" className="btn primary">
            <Plus size={15} />
            New assessment
          </Link>
        }
      />
      <div className="grid4">
        <Metric
          label="Assessments"
          value={n}
          note={`${active} active opportunities`}
        />
        <Metric
          label="Average commercial viability"
          value={
            <>
              {avg("viability")}
              <span style={{ fontSize: 14, color: "#83917f" }}>/100</span>
            </>
          }
          note={`${strong} rated strong · prototype score`}
        />
        <Metric
          label="Capital requirement"
          value={gbp(
            filtered.reduce((s, r) => s + r.financial.cashRequirement, 0),
            true,
          )}
          note="Capex plus working capital"
        />
        <Metric
          label="Three-year opportunity value"
          value={gbp(
            filtered.reduce((s, r) => s + r.financial.threeYearNetValue, 0),
            true,
          )}
          note="Incremental, undiscounted scenario estimate"
        />
      </div>
      <div className="filters">
        <label className="field">
          <span>Sector</span>
          <select
            value={sector}
            onChange={(e) => {
              setSector(e.target.value);
              setPage(0);
            }}
          >
            <option>All sectors</option>
            {sectors.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Circular model</span>
          <select
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setPage(0);
            }}
          >
            <option>All models</option>
            {models.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Assessment stage</span>
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value);
              setPage(0);
            }}
          >
            <option>All stages</option>
            {stages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="field">
          <span>To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <button className="btn" onClick={clear}>
          Clear
        </button>
      </div>
      <div className="stack">
        {view !== "assessments" && (
          <div className="split">
            <Panel
              title="Commercial strength by sector"
              subtitle="Average prototype scores · 0 to 100"
            >
              <ComparisonChart data={chart} />
              <p className="chart-caption">
                Current filters · first six sectors shown. Full sector results
                are available below.
              </p>
            </Panel>
            {view === "programme" || view === "analytics" ? (
              <Panel
                title="Support priorities"
                subtitle="Barriers reported in the selected assessments"
              >
                {barriers.length ? (
                  barriers.map((b) => (
                    <div className="priority-item flex between" key={b.name}>
                      <span className="small">{b.name}</span>
                      <Badge tone="grey">{b.count} cases</Badge>
                    </div>
                  ))
                ) : (
                  <p className="empty">No assessments match these filters.</p>
                )}
              </Panel>
            ) : (
              <Panel
                title="Adviser attention"
                subtitle="Lowest evidence confidence first"
                href="/assessments"
              >
                {[...filtered]
                  .sort(
                    (a, b) => score(a, "confidence") - score(b, "confidence"),
                  )
                  .slice(0, 3)
                  .map((r) => (
                    <Link
                      className="priority-item"
                      href={`/assessments/${r.assessment.id}`}
                      key={r.assessment.id}
                    >
                      <div className="flex between">
                        <h3>{r.organisation.name}</h3>
                        <ArrowUpRight size={15} />
                      </div>
                      <p>
                        {r.assessment.inputs.barriers[0] ?? "Evidence review"} ·
                        confidence {score(r, "confidence")}/100
                      </p>
                    </Link>
                  ))}
              </Panel>
            )}
          </div>
        )}
        {view === "programme" || view === "analytics" ? (
          <>
            <div className="grid3">
              <Metric
                label="Commercial resilience"
                value={`${avg("resilience")}/100`}
                note="Weighted average of nine resilience dimensions"
              />
              <Metric
                label="Investor readiness"
                value={`${avg("readiness")}/100`}
                note="Evidence and commercial preparation"
              />
              <Metric
                label="Evidence confidence"
                value={`${avg("confidence")}/100`}
                note="Declared evidence quality; not independently verified"
              />
            </div>
            <Panel
              title="Sector assessment"
              subtitle="Aggregated results only; no individual business information"
            >
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sector</th>
                      <th>Assessments</th>
                      <th>Viability</th>
                      <th>Readiness</th>
                      <th>Capital need</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(
                      new Set(filtered.map((r) => r.organisation.sector)),
                    ).map((s) => {
                      const g = filtered.filter(
                        (r) => r.organisation.sector === s,
                      );
                      return (
                        <tr key={s}>
                          <td>{s}</td>
                          <td>{g.length}</td>
                          <td>
                            {Math.round(
                              g.reduce((a, r) => a + score(r, "viability"), 0) /
                                g.length,
                            )}
                            /100
                          </td>
                          <td>
                            {Math.round(
                              g.reduce((a, r) => a + score(r, "readiness"), 0) /
                                g.length,
                            )}
                            /100
                          </td>
                          <td>
                            {gbp(
                              g.reduce(
                                (a, r) => a + r.financial.cashRequirement,
                                0,
                              ),
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
            <div className="grid2">
              <Panel title="Circular model distribution">
                <div className="pad">
                  {models
                    .map((m) => ({
                      name: m,
                      count: filtered.filter((r) =>
                        r.assessment.inputs.businessModel.includes(m),
                      ).length,
                    }))
                    .filter((m) => m.count)
                    .map((m) => (
                      <div className="stat-line" key={m.name}>
                        <span>{m.name}</span>
                        <strong>{m.count}</strong>
                      </div>
                    ))}
                </div>
              </Panel>
              <Panel title="Assessment progression">
                <div className="pad">
                  {stages.map((s) => (
                    <div className="stat-line" key={s}>
                      <span>{s}</span>
                      <strong>
                        {
                          filtered.filter((r) => r.assessment.stage === s)
                            .length
                        }
                      </strong>
                    </div>
                  ))}
                  <div className="notice" style={{ marginTop: 20 }}>
                    Small groups are shown only because all records are
                    synthetic. A production programme view will require
                    disclosure thresholds.
                  </div>
                </div>
              </Panel>
            </div>
          </>
        ) : (
          <Panel
            title="Opportunity register"
            subtitle={`${n} assessments in the current view`}
            href={view === "overview" ? "/assessments" : undefined}
          >
            <div
              className="flex between"
              style={{ padding: "0 20px 16px", flexWrap: "wrap" }}
            >
              <div className="flex">
                <Search size={15} />
                <input
                  className="control"
                  aria-label="Search businesses"
                  placeholder="Search businesses"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <label className="flex small muted">
                Sort by
                <select
                  className="control"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="viability">Commercial viability</option>
                  <option value="capital">Capital requirement</option>
                  <option value="name">Business name</option>
                </select>
              </label>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Business / opportunity</th>
                    <th>Stage</th>
                    <th>Viability</th>
                    <th>Resilience</th>
                    <th>Capital</th>
                    <th>Confidence</th>
                    <th>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(page * 6, page * 6 + 6).map((r) => (
                    <tr key={r.assessment.id}>
                      <td>
                        <Link
                          className="company-name"
                          href={`/assessments/${r.assessment.id}`}
                        >
                          {r.organisation.name}
                        </Link>
                        <small className="muted">
                          {r.organisation.sector} ·{" "}
                          {r.assessment.inputs.businessModel[0]}
                        </small>
                      </td>
                      <td>
                        <Badge tone="grey">{r.assessment.stage}</Badge>
                      </td>
                      <td>
                        <div className="mini-score">
                          <strong>{score(r, "viability")}</strong>
                          <span className="track">
                            <span
                              style={{ width: score(r, "viability") + "%" }}
                            />
                          </span>
                        </div>
                      </td>
                      <td>{score(r, "resilience")}/100</td>
                      <td>{gbp(r.financial.cashRequirement, true)}</td>
                      <td>
                        <Badge
                          tone={
                            score(r, "confidence") >= 70
                              ? ""
                              : score(r, "confidence") >= 45
                                ? "amber"
                                : "red"
                          }
                        >
                          {score(r, "confidence") >= 70
                            ? "Higher"
                            : score(r, "confidence") >= 45
                              ? "Moderate"
                              : "Limited"}
                        </Badge>
                      </td>
                      <td>
                        <Link
                          aria-label={`Open ${r.organisation.name}`}
                          href={`/assessments/${r.assessment.id}`}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!n && (
                <p className="empty">
                  No businesses match these filters. Clear filters to restore
                  the portfolio.
                </p>
              )}
            </div>
            <div className="table-footer">
              <span>
                {n
                  ? `${page * 6 + 1}–${Math.min(page * 6 + 6, n)} of ${n} assessments`
                  : "0 assessments"}
              </span>
              <div className="flex">
                <button
                  className="btn"
                  aria-label="Previous page"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  className="btn"
                  aria-label="Next page"
                  disabled={(page + 1) * 6 >= n}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
