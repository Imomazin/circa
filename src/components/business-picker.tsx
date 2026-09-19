import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score";
import type { DashboardRow } from "@/lib/view-types";

/** A selectable list of businesses linking into a per-business tool. */
export function BusinessPicker({
  rows,
  basePath,
  metric,
}: {
  rows: DashboardRow[];
  basePath: string;
  metric: "viability" | "investor" | "headline";
}) {
  const label = metric === "investor" ? "Investor readiness" : metric === "viability" ? "Viability" : "Headline";
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`${basePath}/${r.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-charcoal-50/60 dark:hover:bg-charcoal-800/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="truncate text-2xs text-muted-foreground">
                    {r.sector} · {r.region} · {r.circularModels.join(", ")}
                  </p>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex">{r.stage}</Badge>
                <div className="flex items-center gap-2">
                  <span className="hidden text-2xs uppercase tracking-wider text-muted-foreground sm:inline">{label}</span>
                  <ScoreBadge score={r[metric]} />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
