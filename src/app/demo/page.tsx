import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, DisclaimerBanner, SectionTitle } from "@/components/primitives";
import { Prose } from "@/components/prose";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResetDemo } from "@/components/reset-demo";
import { getOpportunities } from "@/server/network";
import { formatGBP, formatGBPCompact, formatCarbon, formatKm, formatTonnes } from "@/lib/format";

export const metadata: Metadata = { title: "Guided demo" };

export default function DemoPage() {
  // Anchor the journey on a strong, well-evidenced opportunity.
  const m =
    getOpportunities().find((o) => o.strength >= 60 && o.distanceKm < 200 && o.netValue > 150_000) ??
    getOpportunities()[0];

  const steps: { n: number; title: string; say: string; connector?: string; href?: string }[] = [
    { n: 1, title: "ERP surfaces surplus material", connector: "SAP S/4HANA", say: `An ERP feed flags ${formatTonnes(m.volumeTonnes)} of ${m.material.toLowerCase()} at ${m.supplierName}, currently landfill-bound or downcycled.`, href: "/data-network" },
    { n: 2, title: "CIRCA verifies the supplier", connector: "Companies House", say: `The organisation is verified against Companies House and enriched with SIC codes and registered office.`, href: `/businesses/${m.supplierId}` },
    { n: 3, title: "Procurement data identifies demand", connector: "Coupa / Ariba", say: `A procurement feed shows ${m.buyerName} buying in the same category — a candidate buyer.`, href: `/businesses/${m.buyerId}` },
    { n: 4, title: "SEPA provides market context", connector: "SEPA", say: `Regional waste data benchmarks disposal cost and confirms the material is landfill-bound at scale.`, href: "/materials" },
    { n: 5, title: "Route engine calculates distance", connector: "OpenRouteService", say: `Supplier → buyer is ${formatKm(m.distanceKm)}; freight cost and routing follow.`, href: `/opportunities/${m.id}` },
    { n: 6, title: "Climatiq estimates carbon", connector: "Climatiq", say: `Avoided embodied emissions net of transport come to ${formatCarbon(m.carbonTonnes)} a year.`, href: `/opportunities/${m.id}` },
    { n: 7, title: "CIRCA computes the opportunity", say: `Gross ${formatGBPCompact(m.grossMaterialValue)} + avoided disposal ${formatGBPCompact(m.avoidedDisposal)} − transport ${formatGBPCompact(m.transportCost)} − processing ${formatGBPCompact(m.processingCost)} = ${formatGBP(m.netValue)} net a year.`, href: `/opportunities/${m.id}` },
    { n: 8, title: "Scenario Lab tests the economics", say: `Flex transport rate, take-up and yield; the net value and payback move live.`, href: `/opportunities/${m.id}` },
    { n: 9, title: "The opportunity stays viable", say: `Even under the conservative case the loop remains commercially positive — it is actionable.`, href: `/opportunities/${m.id}` },
    { n: 10, title: "A CRM engagement is created", connector: "Salesforce", say: `Ownership, next step and deal stage are tracked (write-back ready to configure).`, href: `/opportunities/${m.id}` },
    { n: 11, title: "A sourcing event is prepared", connector: "SAP Ariba", say: `The opportunity can be exported as a draft sourcing event for procurement.`, href: "/data-network" },
    { n: 12, title: "Pipeline progresses to feasibility", say: `The opportunity advances through the nine-stage pipeline with activity logged.`, href: "/matches" },
  ];

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Guided demo"
        title="From connected data to a circular deal"
        description="A boardroom walkthrough of the ecosystem: how ERP, procurement, organisation, waste, carbon and logistics signals combine into one commercially actionable circular opportunity."
      />

      <Card className="mb-7">
        <CardHeader>
          <CardTitle>The opportunity in focus</CardTitle>
          <CardDescription>
            {m.material} · {m.supplierName} → {m.buyerName}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 p-5 pt-0 sm:grid-cols-4">
          <Stat label="Net value / yr" value={formatGBPCompact(m.netValue)} />
          <Stat label="Carbon / yr" value={formatCarbon(m.carbonTonnes)} />
          <Stat label="Distance" value={formatKm(m.distanceKm)} />
          <Stat label="Readiness" value={`${m.strength}/100`} />
        </CardContent>
      </Card>

      <SectionTitle>The twelve-step journey</SectionTitle>
      <ol className="mb-8 flex flex-col">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-4 border-b border-border py-3.5 last:border-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-evergreen-700 font-display text-xs font-semibold text-white">
              {s.n}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                {s.connector && (
                  <span className="rounded-[0.3rem] border border-border-strong px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                    {s.connector}
                  </span>
                )}
                {s.href && (
                  <Link href={s.href} className="text-2xs font-medium text-evergreen-600 hover:underline">
                    Open →
                  </Link>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.say}</p>
            </div>
          </li>
        ))}
      </ol>

      <Prose title="What not to claim">
        <ul>
          <li>Connector states are shown honestly; no live production connection is implied.</li>
          <li>Scores and values are decision-support outputs for evaluation, not validated measures.</li>
          <li>No Zero Waste Scotland or CivTech endorsement, and no production deployment, is implied.</li>
        </ul>
      </Prose>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reset demo data</CardTitle>
          <CardDescription>Restore the deterministic dataset after a live walkthrough.</CardDescription>
        </CardHeader>
        <CardContent><ResetDemo /></CardContent>
      </Card>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
