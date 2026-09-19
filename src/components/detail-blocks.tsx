import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatGBPCompact } from "@/lib/format";
import type {
  EvidenceItemRow,
  RecommendationRow,
  ResourceDependencyRow,
  SupplierRiskRow,
} from "@/db/schema";

function riskVariant(level: string): React.ComponentProps<typeof Badge>["variant"] {
  return level === "High" ? "danger" : level === "Medium" ? "warn" : "evergreen";
}
function statusVariant(status: string): React.ComponentProps<typeof Badge>["variant"] {
  return status === "Verified" ? "evergreen" : status === "Provisional" ? "amber" : "outline";
}
function priorityVariant(p: string): React.ComponentProps<typeof Badge>["variant"] {
  return p === "High" ? "danger" : p === "Medium" ? "warn" : "outline";
}

export function EvidenceTable({ items }: { items: EvidenceItemRow[] }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">No evidence recorded.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Linked area</TableHead>
          <TableHead className="text-right">Confidence</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="whitespace-nowrap font-medium text-foreground">{e.type}</TableCell>
            <TableCell className="text-muted-foreground">{e.description}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{e.linkedArea}</TableCell>
            <TableCell className="text-right tabular-nums">{e.confidence}</TableCell>
            <TableCell><Badge variant={statusVariant(e.status)}>{e.status}</Badge></TableCell>
            <TableCell className="whitespace-nowrap text-2xs text-muted-foreground">{formatDate(e.dateRecorded)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function RecommendationList({ items }: { items: RecommendationRow[] }) {
  if (!items.length)
    return <p className="text-xs text-muted-foreground">No open recommendations — the case is well evidenced.</p>;
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((r) => (
        <li key={r.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
          <Badge variant={priorityVariant(r.priority)} className="mt-0.5 shrink-0">{r.priority}</Badge>
          <div>
            <p className="text-sm font-medium text-foreground">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.rationale}</p>
            <span className="mt-0.5 inline-block text-2xs uppercase tracking-wider text-warmgrey-500">{r.category}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ResourceTable({ items }: { items: ResourceDependencyRow[] }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">No resource dependencies recorded.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Material</TableHead>
          <TableHead>Criticality</TableHead>
          <TableHead className="text-right">Annual spend</TableHead>
          <TableHead>Volatility</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium text-foreground">
              {r.material}
              {r.notes && <p className="text-2xs text-muted-foreground">{r.notes}</p>}
            </TableCell>
            <TableCell><Badge variant={riskVariant(r.criticality)}>{r.criticality}</Badge></TableCell>
            <TableCell className="text-right tabular-nums">{formatGBPCompact(r.annualSpend)}</TableCell>
            <TableCell><Badge variant={riskVariant(r.volatility)}>{r.volatility}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function SupplierTable({ items }: { items: SupplierRiskRow[] }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">No supplier risks recorded.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Supplier</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Share</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Risk</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium text-foreground">{s.supplier}</TableCell>
            <TableCell className="text-muted-foreground">{s.category}</TableCell>
            <TableCell className="text-right tabular-nums">{s.shareOfSupplyPct}%</TableCell>
            <TableCell className="text-muted-foreground">{s.region}</TableCell>
            <TableCell><Badge variant={riskVariant(s.riskLevel)}>{s.riskLevel}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
