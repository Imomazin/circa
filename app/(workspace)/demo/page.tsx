import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { requireWorkspace } from "@/lib/services/session";
import { getPortfolio } from "@/lib/services/portfolio";
import { PageHead, Panel, Badge } from "@/components/ui/primitives";
import { DemoControls } from "@/components/domain/demo-controls";
export default async function Page() {
  const w = await requireWorkspace(),
    rows = await getPortfolio(w.id);
  const cases = [
    "Caledon Furniture Works",
    "Forth Equipment Services",
    "North Coast Textiles",
  ]
    .map((name) => rows.find((r) => r.organisation.name === name))
    .filter((r) => !!r);
  const main = cases[0];
  return (
    <div className="stack">
      <PageHead
        eyebrow="PRESENTER WORKSPACE"
        title="Demonstrate the commercial decision"
        description="A seven-minute walkthrough from portfolio review to a saved investment case."
      />
      <div className="grid3">
        {cases.map((r, i) => (
          <section className="panel demo-card" key={r.assessment.id}>
            <Badge tone={i === 2 ? "amber" : ""}>
              {["Balanced opportunity", "Recurring revenue", "Evidence gap"][i]}
            </Badge>
            <h2>{r.organisation.name}</h2>
            <p>{r.assessment.inputs.opportunity}</p>
            <Link
              className="btn primary"
              href={`/assessments/${r.assessment.id}`}
              style={{ marginTop: 20 }}
            >
              Open scenario <ArrowUpRight size={14} />
            </Link>
          </section>
        ))}
      </div>
      <Panel
        title="Seven-minute demonstration"
        subtitle="Live database changes; no external integrations required"
      >
        <div className="pad timeline">
          {[
            [
              "0:00–0:45",
              "Read the portfolio",
              "Open Overview. Point out viability, capital requirement and evidence confidence.",
              "/overview",
            ],
            [
              "0:45–1:30",
              "Inspect the opportunity",
              "Open Caledon. Review the current operating model and take-back proposition.",
              main ? `/assessments/${main.assessment.id}` : "/assessments",
            ],
            [
              "1:30–3:00",
              "Test the commercial case",
              "Open Financial scenarios. Increase material expenditure reduction from 20% to 35%. Observe contribution, payback and viability. Save the scenario.",
              main
                ? `/assessments/${main.assessment.id}?tab=scenarios`
                : "/assessments",
            ],
            [
              "3:00–4:00",
              "Explain the judgement",
              "Click Commercial viability. Review component weights and missing customer evidence.",
              main ? `/assessments/${main.assessment.id}` : "/assessments",
            ],
            [
              "4:00–5:00",
              "Review resilience and funding gaps",
              "Inspect supplier concentration and investor readiness. Separate the commercial opportunity from evidence still required.",
              main
                ? `/assessments/${main.assessment.id}?tab=resilience`
                : "/assessments",
            ],
            [
              "5:00–6:00",
              "Open the investment case",
              "Review the saved base case against upside and downside. Open browser print if a document is needed.",
              main
                ? `/assessments/${main.assessment.id}?tab=investment`
                : "/assessments",
            ],
            [
              "6:00–7:00",
              "Show programme insight",
              "Open Programme insight, filter a sector and identify where support is most needed. Close on the validation work ahead.",
              "/programme",
            ],
          ].map(([time, title, copy, url]) => (
            <article key={time}>
              <div className="flex between">
                <h3>
                  {time} · {title}
                </h3>
                <Link className="text-link small" href={url}>
                  Open <Play size={12} />
                </Link>
              </div>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </Panel>
      <section className="panel pad">
        <DemoControls />
      </section>
      <div className="notice">
        This is a product demonstrator using synthetic data and deterministic
        rules. It is not an approved CivTech solution. Scores, investment
        outcomes and external integrations have not been independently
        validated.
      </div>
    </div>
  );
}
