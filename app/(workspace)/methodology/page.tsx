import { PageHead, Panel } from "@/components/ui/primitives";
import { scoreAssessment } from "@/lib/scoring/commercial";
import { seedInputs } from "@/lib/demo/fixtures";
export default function Page() {
  const x = seedInputs()[0],
    scores = scoreAssessment(x.factors, x.baseline, x.scenario);
  return (
    <div className="stack">
      <PageHead
        eyebrow="METHODOLOGY v0.1"
        title="How the assessment works"
        description="Transparent rules connect business evidence with financial assumptions. Scores are not externally validated."
      />
      <div className="grid2">
        {scores.map((s) => (
          <Panel
            key={s.key}
            title={s.label}
            subtitle="Weighted component scores, each bounded between 0 and 100"
          >
            <div className="pad">
              {s.components.map((c) => (
                <div className="stat-line" key={c.label}>
                  <div>
                    <h3>{c.label}</h3>
                    <p className="small muted">{c.explanation}</p>
                  </div>
                  <strong>{Math.round(c.weight * 100)}%</strong>
                </div>
              ))}
            </div>
          </Panel>
        ))}
        <Panel title="Bands and interpretation">
          <div className="pad">
            <div className="stat-line">
              <span>75 to 100</span>
              <strong>Strong</strong>
            </div>
            <div className="stat-line">
              <span>55 to 74</span>
              <strong>Developing</strong>
            </div>
            <div className="stat-line">
              <span>35 to 54</span>
              <strong>Needs evidence</strong>
            </div>
            <div className="stat-line">
              <span>0 to 34</span>
              <strong>High uncertainty</strong>
            </div>
            <p className="small muted" style={{ marginTop: 20 }}>
              Confidence uses declared evidence quality: 75+ higher, 45–74
              moderate and below 45 limited. It does not express a statistical
              probability.
            </p>
          </div>
        </Panel>
      </div>
      <Panel title="Financial calculation">
        <div className="pad stack">
          <p className="small">
            Circular revenue = baseline revenue × (1 + core revenue change) +
            additional recurring revenue.
          </p>
          <p className="small">
            Circular material cost = baseline material cost × (1 − material
            saving) × (1 + supplier price shock).
          </p>
          <p className="small">
            Contribution = revenue − material, labour, energy, maintenance and
            overhead costs. The circular case also deducts additional labour and
            operating costs.
          </p>
          <p className="small">
            Simple payback = (capex + working capital) ÷ incremental annual
            contribution × 12. Non-positive uplift has no payback.
          </p>
          <p className="small">
            Three-year opportunity value = 3 × annual uplift − capex − working
            capital + year 3 residual value.
          </p>
          <p className="small muted">
            No tax, financing, depreciation or discounting. Working capital
            remains tied up through year 3. Retention changes resilience scoring
            only. No physical material-flow or carbon calculation is implied by
            expenditure savings.
          </p>
        </div>
      </Panel>
      <div className="notice">
        Human review is required before any business or funding decision.
        Co-design, empirical validation, benchmarking and bias assessment remain
        future research.
      </div>
    </div>
  );
}
