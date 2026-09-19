import type { Metadata } from "next";
import { PageHeader, DisclaimerBanner } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Methodology" };

const DIMENSIONS = [
  { name: "Commercial Viability", weight: "40% of headline", what: "Does the opportunity make commercial sense? Market pull, revenue and margin potential, capital efficiency, payback, feasibility and downside risk." },
  { name: "Commercial Resilience", weight: "20% of headline", what: "Ability to withstand supply, resource and demand shocks — supplier and material concentration, price volatility, recurring revenue and retention." },
  { name: "Investor Readiness", weight: "25% of headline", what: "How fundable it is today — customer evidence, traction, unit economics, capability, clarity of the capital ask and risk understanding." },
  { name: "Circular Opportunity", weight: "15% of headline", what: "Strength of the underlying circular opportunity — material recovery, lifetime extension, circular revenue-model strength and supply-chain benefit." },
  { name: "Evidence Confidence", weight: "Modifier", what: "How much weight to place on the other scores — coverage, recency, independence and verification of the supporting evidence." },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Trust & governance"
        title="Methodology"
        description="How Circa turns an assessment into prototype decision-support scores — transparently, and without a black box."
      />
      <div className="mb-6"><DisclaimerBanner /></div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader><CardTitle>What Circa measures</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimension</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>What it captures</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DIMENSIONS.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">{d.name}</TableCell>
                    <TableCell><Badge variant="outline">{d.weight}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{d.what}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Prose title="How prototype scoring works">
          <p>
            Each dimension is a <strong>transparent weighted average</strong> of 4–12 component sub-scores, each on a 0–100 scale.
            Component weights sum to 1 within a dimension and are fixed in code (see <code>src/domain/scoring</code>). Some inputs
            are inverted where &ldquo;higher is worse&rdquo; (for example supplier concentration and resource-price volatility),
            so that every component points in the same direction — higher is better.
          </p>
          <p>
            Two components are derived rather than entered directly: <em>capital efficiency</em> (capex relative to the annual
            commercial benefit it unlocks) and <em>payback</em> (the speed of recovery), both mapped onto a 0–100 desirability
            curve. Scores are banded into Weak, Emerging, Developing, Strong and Compelling for quick reading.
          </p>
          <p>
            The engine is <strong>deterministic</strong>: the same inputs always produce the same scores. There is no randomness
            and no machine-learning model in the core product (see the Responsible AI note in the repository).
          </p>
        </Prose>

        <Prose title="What confidence means">
          <p>
            Evidence Confidence is computed first and attached to every other dimension as a confidence level (Low, Moderate,
            High). It reflects the coverage, recency, independence and verification status of the supporting evidence — not the
            strength of the opportunity. A <strong>high viability score with low evidence confidence</strong> is a prompt to
            validate, not a green light; the dashboard surfaces exactly this combination.
          </p>
        </Prose>

        <Prose title="How financial scenarios work">
          <p>
            The scenario modeller is a small, explicit P&amp;L. A business has a baseline (today&rsquo;s revenue and cost lines).
            Each scenario applies a set of assumption levers — revenue and cost changes, capex, recurring-revenue share, retention
            and residual value — and the engine recomputes revenue, COGS, gross margin, operating costs, EBITDA, EBITDA uplift
            versus baseline, cash requirement and simple payback. Sensitivity analysis applies single-variable shocks (for
            example material costs +10%) and reports how the outputs respond. Every calculation is visible and reproducible.
          </p>
        </Prose>

        <Prose title="Limitations">
          <ul>
            <li>Scores are <strong>prototype decision-support outputs</strong>, not scientifically validated measures.</li>
            <li>Weights are expert-set defaults, not empirically calibrated against outcomes.</li>
            <li>All demonstrator data is synthetic and illustrative.</li>
            <li>The financial model is deliberately simple (annual, single-period payback) and omits discounting and tax.</li>
          </ul>
        </Prose>

        <Prose title="Human oversight & interpretation">
          <p>
            Circa is a decision-support tool for people, not an automated decision-maker. Scores should be read alongside the
            evidence, the drivers and the missing-evidence flags shown on each assessment, and interpreted by an adviser,
            analyst or investment professional in context.
          </p>
        </Prose>

        <Prose title="Future validation work">
          <ul>
            <li>Calibrate weights against real programme and investment outcomes.</li>
            <li>Introduce discounted cash flow and multi-year modelling.</li>
            <li>Independent review of the scoring framework with sector and finance experts.</li>
            <li>Backtesting of predicted viability against realised commercial performance.</li>
          </ul>
        </Prose>
      </div>
    </div>
  );
}

function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_li]:ml-4 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
