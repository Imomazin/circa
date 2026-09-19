import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/print-button";
import { ScoreStrip } from "@/components/dimension-card";
import { RecommendationList } from "@/components/detail-blocks";
import { getBusinessDetail } from "@/server/queries";
import { formatGBP, formatPct, formatPayback } from "@/lib/format";
import { bandForScore } from "@/domain/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  return { title: detail ? `Investment case · ${detail.org.name}` : "Investment case" };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2 border-b border-border pb-1 text-sm font-semibold uppercase tracking-wider text-evergreen-700 dark:text-evergreen-300">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function InvestmentCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getBusinessDetail(id);
  if (!detail) notFound();

  const { org, assessment, bundle, score, scenarioSet, recommendations, evidence } = detail;
  const circular = scenarioSet.circular_base;
  const upside = scenarioSet.upside;
  const downside = scenarioSet.downside;
  const keyActions = recommendations.slice(0, 5);
  const verified = evidence.filter((e) => e.status === "Verified").length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between no-print">
        <Link href={`/investor-readiness/${id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to investor readiness
        </Link>
        <PrintButton />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
          {/* Header */}
          <header className="border-b border-border pb-4">
            <p className="text-2xs font-semibold uppercase tracking-widest text-amber-500">Investment case · Prototype decision-support</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{org.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {org.sector} · {org.region} · {org.companySize}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {assessment.circularModels.map((m) => (
                <Badge key={m} variant="evergreen">{m}</Badge>
              ))}
              <Badge variant="outline">{assessment.stage}</Badge>
            </div>
          </header>

          <ScoreStrip
            scores={[
              { label: "Viability", value: bundle.viability.score },
              { label: "Resilience", value: bundle.resilience.score },
              { label: "Investor", value: bundle.investor.score },
              { label: "Opportunity", value: bundle.opportunity.score },
              { label: "Evidence", value: bundle.evidence.score },
            ]}
          />

          <Section title="Business summary">
            <p className="text-sm text-foreground">{org.description}</p>
          </Section>

          <Section title="Circular opportunity">
            <p className="text-sm text-foreground">{assessment.opportunitySummary}</p>
          </Section>

          <Section title="Commercial rationale">
            <p className="text-sm text-foreground">{assessment.commercialRationale}</p>
          </Section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Section title="Financial scenario (annual)">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-2xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-1 text-left">Metric</th>
                    <th className="py-1 text-right">Circular</th>
                    <th className="py-1 text-right">Upside</th>
                    <th className="py-1 text-right">Downside</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  <CaseRow label="Revenue" c={circular.revenue} u={upside.revenue} d={downside.revenue} money />
                  <CaseRow label="Gross margin" c={circular.grossMarginPct} u={upside.grossMarginPct} d={downside.grossMarginPct} pct />
                  <CaseRow label="EBITDA" c={circular.ebitda} u={upside.ebitda} d={downside.ebitda} money />
                  <CaseRow label="EBITDA uplift" c={circular.annualBenefitVsBaseline} u={upside.annualBenefitVsBaseline} d={downside.annualBenefitVsBaseline} money />
                </tbody>
              </table>
            </Section>

            <Section title="Capital & returns">
              <dl className="text-sm">
                <CaseKV label="Capital requirement" value={formatGBP(circular.capex)} />
                <CaseKV label="Cash requirement" value={formatGBP(circular.cashRequirement)} />
                <CaseKV label="Payback (circular)" value={formatPayback(circular.paybackYears)} />
                <CaseKV label="Payback (downside)" value={formatPayback(downside.paybackYears)} />
                <CaseKV label="Residual value" value={formatGBP(circular.residualValue)} />
              </dl>
            </Section>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Section title="Commercial resilience">
              <p className="text-sm text-foreground">
                Resilience scores <strong>{bundle.resilience.score.toFixed(1)}</strong> ({bandForScore(bundle.resilience.score)}).
                {bundle.resilience.positiveDrivers.length > 0 && ` Strengths: ${bundle.resilience.positiveDrivers.slice(0, 3).join(", ")}.`}
                {bundle.resilience.negativeDrivers.length > 0 && ` Watch: ${bundle.resilience.negativeDrivers.slice(0, 2).join(", ")}.`}
              </p>
            </Section>
            <Section title="Investor readiness">
              <p className="text-sm text-foreground">
                Readiness scores <strong>{bundle.investor.score.toFixed(1)}</strong> ({bandForScore(bundle.investor.score)}) at {bundle.investor.confidence.toLowerCase()} confidence.
                {bundle.investor.missingEvidence.length > 0 && ` Gaps: ${bundle.investor.missingEvidence.join("; ")}.`}
              </p>
            </Section>
          </div>

          <Section title="Major risks">
            <ul className="flex flex-col gap-1 text-sm text-foreground">
              {[...bundle.viability.negativeDrivers, ...bundle.resilience.negativeDrivers].slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" /> {r}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Evidence quality">
            <p className="text-sm text-foreground">
              Evidence confidence scores <strong>{score.evidence.toFixed(1)}</strong> ({bundle.evidence.confidence}).
              {" "}{verified} of {evidence.length} evidence items are verified. Interpret scores with lower evidence confidence as directional.
            </p>
          </Section>

          <Section title="Key assumptions">
            <ul className="grid grid-cols-1 gap-1 text-sm text-foreground sm:grid-cols-2">
              <li>Revenue change: {formatPct(circular.revenue / detail.assessment.baseline.revenue * 100 - 100, 0)} vs baseline</li>
              <li>Recurring revenue: {formatGBP(circular.recurringRevenue)}</li>
              <li>Retention: {circular.customerRetentionPct}%</li>
              <li>Capex: {formatGBP(circular.capex)}</li>
            </ul>
          </Section>

          <Section title="Recommended actions">
            <RecommendationList items={keyActions} />
          </Section>

          <Section title="Decision considerations">
            <p className="text-sm text-foreground">
              On the circular base case, {org.name} shows a {bandForScore(bundle.viability.score).toLowerCase()} commercial-viability
              profile with a {formatPayback(circular.paybackYears)} payback on {formatGBP(circular.capex)} of capital. The primary decision
              gate is {bundle.evidence.score < 55 ? "evidence quality — validation should precede a funding commitment" : "execution capability and capital structuring"}.
            </p>
          </Section>

          <footer className="border-t border-border pt-3 text-2xs text-muted-foreground">
            Circa product demonstrator · All data is synthetic · Prototype decision-support outputs, not validated measures ·
            No Zero Waste Scotland or CivTech endorsement implied · Ambidexters Ltd × The DataKirk SCIO · CivTech 12.3.
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}

function CaseRow({ label, c, u, d, money, pct }: { label: string; c: number; u: number; d: number; money?: boolean; pct?: boolean }) {
  const f = (n: number) => (money ? formatGBP(n) : pct ? formatPct(n) : String(n));
  return (
    <tr className="border-t border-border">
      <td className="py-1 text-muted-foreground">{label}</td>
      <td className="py-1 text-right font-medium text-foreground">{f(c)}</td>
      <td className="py-1 text-right text-evergreen-600">{f(u)}</td>
      <td className="py-1 text-right text-red-500">{f(d)}</td>
    </tr>
  );
}

function CaseKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
