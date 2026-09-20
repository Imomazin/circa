"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SelectField } from "@/components/ui/select";
import { StatTile, SectionTitle } from "@/components/primitives";
import { ScoreBadge } from "@/components/score";
import {
  ScoreBars,
  HorizontalBars,
  DonutChart,
  ScatterPlot,
  type NamedValue,
} from "@/components/charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatGBPCompact } from "@/lib/format";
import { bandDistribution, avgByCategory, countBy, sum } from "@/lib/analytics";
import { SECTORS, ASSESSMENT_STAGES, SCORE_BANDS } from "@/domain/constants";
import type { DashboardRow } from "@/lib/view-types";

const ALL = "All";

export function Dashboard({ rows }: { rows: DashboardRow[] }) {
  const [sector, setSector] = React.useState(ALL);
  const [stage, setStage] = React.useState(ALL);
  const [viabilityBand, setViabilityBand] = React.useState(ALL);
  const [investorBand, setInvestorBand] = React.useState(ALL);

  const filtered = React.useMemo(
    () =>
      rows.filter(
        (r) =>
          (sector === ALL || r.sector === sector) &&
          (stage === ALL || r.stage === stage) &&
          (viabilityBand === ALL || r.viabilityBand === viabilityBand) &&
          (investorBand === ALL || r.investorBand === investorBand),
      ),
    [rows, sector, stage, viabilityBand, investorBand],
  );

  const totalCapex = sum(filtered.map((r) => r.capex));
  const totalOpportunity = sum(filtered.map((r) => r.projectedOpportunity));
  const needSupport = filtered.filter((r) => r.viability >= 60 && r.evidence < 50).length;
  const activeOpportunities = filtered.filter((r) => r.stage !== "Draft").length;

  const viabilityDist = bandDistribution(filtered.map((r) => r.viability)).map((d) => ({
    name: d.name,
    value: d.value,
  }));
  const investorDist = bandDistribution(filtered.map((r) => r.investor)).map((d) => ({
    name: d.name,
    value: d.value,
  }));
  const viabilityBySector = avgByCategory(filtered, (r) => r.sector, (r) => r.viability);
  const capexByModel = capexByCircularModel(filtered);
  const modelDist = modelDistribution(filtered);
  const sectorDist = countBy(filtered, (r) => r.sector).sort((a, b) => b.value - a.value);
  const barriers = topBarriers(filtered.flatMap((r) => r.viabilityBarriers));
  const scatter = filtered.map((r) => ({ x: r.viability, y: r.evidence, z: r.capex, name: r.name }));

  const opts = (vals: readonly string[]) => [
    { value: ALL, label: "All" },
    ...vals.map((v) => ({ value: v, label: v })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-4">
        <SelectField label="Sector" value={sector} onChange={(e) => setSector(e.target.value)} options={opts(SECTORS)} />
        <SelectField label="Assessment stage" value={stage} onChange={(e) => setStage(e.target.value)} options={opts(ASSESSMENT_STAGES)} />
        <SelectField label="Commercial viability" value={viabilityBand} onChange={(e) => setViabilityBand(e.target.value)} options={opts(SCORE_BANDS)} />
        <SelectField label="Investor readiness" value={investorBand} onChange={(e) => setInvestorBand(e.target.value)} options={opts(SCORE_BANDS)} />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Businesses" value={filtered.length} accent="evergreen" />
        <StatTile label="Active opportunities" value={activeOpportunities} sublabel="Past draft stage" />
        <StatTile label="Capital requirement" value={formatGBPCompact(totalCapex)} accent="amber" sublabel="Prototype capex" />
        <StatTile label="Commercial opportunity" value={formatGBPCompact(totalOpportunity)} accent="evergreen" sublabel="Projected annual" />
        <StatTile label="Median viability" value={median(filtered.map((r) => r.viability)).toFixed(0)} sublabel="0–100 score" />
        <StatTile label="Need adviser support" value={needSupport} accent="amber" sublabel="High viability, low evidence" />
      </div>

      {filtered.length === 0 && (
        <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No businesses match the current filters.
        </p>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commercial viability by sector</CardTitle>
            <CardDescription>Which sectors show the strongest commercial case for circular models</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={viabilityBySector} domain={[0, 100]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capital requirement by circular model</CardTitle>
            <CardDescription>Average prototype capex, £ — which models are most capital-hungry</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={capexByModel} color="#c98a2b" unit="" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Viability vs evidence confidence</CardTitle>
            <CardDescription>Top-left = strong case, thin evidence. These need validation before funding.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScatterPlot data={scatter} xLabel="Commercial viability" yLabel="Evidence confidence" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commercial viability distribution</CardTitle>
            <CardDescription>Businesses per viability band</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBars data={viabilityDist} colorByValue={false} height={230} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investor readiness distribution</CardTitle>
            <CardDescription>Businesses per readiness band</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBars data={investorDist} colorByValue={false} height={230} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Circular model distribution</CardTitle>
            <CardDescription>Adoption across the portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={modelDist} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sector distribution</CardTitle>
            <CardDescription>Businesses per sector</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={sectorDist} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common commercial barriers</CardTitle>
            <CardDescription>Most frequent weak commercial-viability components</CardDescription>
          </CardHeader>
          <CardContent>
            {barriers.length ? (
              <HorizontalBars data={barriers} color="#b4472f" height={230} />
            ) : (
              <p className="py-8 text-center text-xs text-muted-foreground">No common barriers in this selection.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Opportunity pipeline table */}
      <div>
        <SectionTitle hint={`${filtered.length} businesses`}>Opportunity pipeline</SectionTitle>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Circular model</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Capex</TableHead>
                  <TableHead className="text-right">Viability</TableHead>
                  <TableHead className="text-right">Investor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/businesses/${r.id}`} className="font-medium text-foreground hover:text-evergreen-600 hover:underline">
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.sector}</TableCell>
                    <TableCell className="text-muted-foreground">{r.circularModels[0]}</TableCell>
                    <TableCell className="text-muted-foreground">{r.stage}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatGBPCompact(r.capex)}</TableCell>
                    <TableCell className="text-right"><ScoreBadge score={r.viability} /></TableCell>
                    <TableCell className="text-right"><ScoreBadge score={r.investor} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function median(ns: number[]): number {
  if (!ns.length) return 0;
  const s = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function modelDistribution(rows: DashboardRow[]): NamedValue[] {
  const m = new Map<string, number>();
  for (const r of rows) for (const model of r.circularModels) m.set(model, (m.get(model) ?? 0) + 1);
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function capexByCircularModel(rows: DashboardRow[]): NamedValue[] {
  const spend = new Map<string, number[]>();
  for (const r of rows)
    for (const model of r.circularModels) {
      const arr = spend.get(model) ?? [];
      arr.push(r.capex);
      spend.set(model, arr);
    }
  return [...spend.entries()]
    .map(([name, vals]) => ({ name, value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function topBarriers(labels: string[]): NamedValue[] {
  const m = new Map<string, number>();
  for (const l of labels) {
    const clean = l.replace(/\s*\(\d+\)$/, "").replace(/\s*\(inverted\)/, "");
    m.set(clean, (m.get(clean) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}
