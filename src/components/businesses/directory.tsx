"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SelectField } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge, ConfidenceBadge } from "@/components/score";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatGBPCompact } from "@/lib/format";
import { SECTORS } from "@/domain/constants";
import type { DashboardRow } from "@/lib/view-types";

const ALL = "All";
type SortKey = "headline" | "viability" | "investor" | "resilience" | "capex" | "name";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "headline", label: "Headline score" },
  { value: "viability", label: "Commercial viability" },
  { value: "investor", label: "Investor readiness" },
  { value: "resilience", label: "Commercial resilience" },
  { value: "capex", label: "Capital requirement" },
  { value: "name", label: "Name (A–Z)" },
];

export function BusinessDirectory({ rows }: { rows: DashboardRow[] }) {
  const [q, setQ] = React.useState("");
  const [sector, setSector] = React.useState(ALL);
  const [sort, setSort] = React.useState<SortKey>("headline");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (sector === ALL || r.sector === sector) &&
        (!needle ||
          r.name.toLowerCase().includes(needle) ||
          r.sector.toLowerCase().includes(needle) ||
          r.region.toLowerCase().includes(needle) ||
          r.circularModels.some((m) => m.toLowerCase().includes(needle))),
    );
    out.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return (b[sort] as number) - (a[sort] as number);
    });
    return out;
  }, [rows, q, sector, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-[1fr_200px_220px]">
        <div className="flex flex-col gap-1">
          <label htmlFor="biz-search" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
            Search
          </label>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              id="biz-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, sector, region or circular model…"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <SelectField
          label="Sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          options={[{ value: ALL, label: "All sectors" }, ...SECTORS.map((s) => ({ value: s, label: s }))]}
        />
        <SelectField
          label="Sort by"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          options={SORTS}
        />
      </div>

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
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">Headline <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right">Viability</TableHead>
                <TableHead className="text-right">Investor</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/businesses/${r.id}`} className="font-medium text-foreground hover:text-evergreen-600 hover:underline">
                      {r.name}
                    </Link>
                    <p className="text-2xs text-muted-foreground">{r.region} · {r.companySize}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.sector}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.circularModels.map((m) => (
                        <Badge key={m} variant="outline">{m}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.stage}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatGBPCompact(r.capex)}</TableCell>
                  <TableCell className="text-right"><ScoreBadge score={r.headline} /></TableCell>
                  <TableCell className="text-right tabular-nums">{r.viability.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.investor.toFixed(1)}</TableCell>
                  <TableCell><ConfidenceBadge level={r.confidence} /></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No businesses match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-2xs text-muted-foreground">{filtered.length} of {rows.length} businesses</p>
    </div>
  );
}
