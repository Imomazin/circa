import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, DisclaimerBanner } from "@/components/primitives";
import { Prose } from "@/components/prose";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResetDemo } from "@/components/reset-demo";

export const metadata: Metadata = { title: "Demo" };

const STEPS: { n: number; title: string; href?: string; say: string }[] = [
  { n: 1, title: "Open the executive dashboard", href: "/", say: "Start with the portfolio: viability by sector, capital by model, and the viability-vs-evidence scatter that flags where to validate." },
  { n: 2, title: "Select a sample business", href: "/businesses/caledon-furniture-works", say: "Open Caledon Furniture Works — a furniture refurbishment and take-back opportunity with strong demand but supplier concentration risk." },
  { n: 3, title: "Review its current assessment", href: "/assessments/caledon-furniture-works", say: "Walk the five commercial dimensions and the evidence behind each judgement." },
  { n: 4, title: "Open the circular opportunity", href: "/businesses/caledon-furniture-works", say: "Read the opportunity summary and commercial rationale on the business profile." },
  { n: 5, title: "Change a commercial assumption", href: "/scenarios/caledon-furniture-works", say: "In the scenario modeller, nudge revenue or material cost and watch every output recalculate." },
  { n: 6, title: "See the financial scenario update", href: "/scenarios/caledon-furniture-works", say: "EBITDA, payback and cash requirement all move; save to persist the change." },
  { n: 7, title: "Inspect Commercial Viability", href: "/assessments/caledon-furniture-works", say: "Open the viability card — the score decomposes into weighted components." },
  { n: 8, title: "Understand the score drivers", href: "/assessments/caledon-furniture-works", say: "Positive and negative drivers explain the number; missing-evidence flags show what to firm up." },
  { n: 9, title: "Review resilience", href: "/assessments/caledon-furniture-works", say: "Supplier concentration pulls resilience down — a concrete, actionable finding." },
  { n: 10, title: "Review investor readiness", href: "/investor-readiness/caledon-furniture-works", say: "See the readiness radar, the capital ask and the actions required before funding." },
  { n: 11, title: "Open the investment case", href: "/investor-readiness/caledon-furniture-works/case", say: "A print-friendly one-pager pulling the whole story together." },
  { n: 12, title: "Switch to programme intelligence", href: "/programme", say: "Zoom out to the anonymised programme view for policy and funders." },
];

export default function DemoPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Trust & governance"
        title="Guided demo"
        description="A 6–8 minute walkthrough of Circa's commercial-intelligence story, from portfolio to a single investment case and back to the programme view."
      />
      <div className="mb-6"><DisclaimerBanner /></div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run the demo</CardTitle>
          <CardDescription>Follow the steps in order. Each links straight to the right screen.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-0">
          <ol className="divide-y divide-border">
            {STEPS.map((s) => (
              <li key={s.n} className="flex items-start gap-3 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-evergreen-700 text-2xs font-semibold text-white">
                  {s.n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    {s.href && (
                      <Link href={s.href}>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-2xs text-evergreen-600">Open →</Button>
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.say}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Prose title="What not to claim">
        <ul>
          <li>Do not present the scores as validated or as official Zero Waste Scotland outputs.</li>
          <li>Do not imply CivTech endorsement or a production deployment.</li>
          <li>Be explicit that the data is synthetic and the scores are prototype decision-support.</li>
        </ul>
      </Prose>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reset demo data</CardTitle>
          <CardDescription>Restore the deterministic seed after a live walkthrough.</CardDescription>
        </CardHeader>
        <CardContent><ResetDemo /></CardContent>
      </Card>
    </div>
  );
}
