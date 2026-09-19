import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives";
import { Prose } from "@/components/prose";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAuditEvents } from "@/server/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Governance" };
export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const events = await getAuditEvents(30);
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Trust & governance"
        title="Governance"
        description="How Circa handles data, decisions and accountability — and the audit trail behind material actions."
      />

      <div className="flex flex-col gap-6">
        <Prose title="Data & privacy">
          <ul>
            <li>All demonstrator data is <strong>synthetic</strong>; no real business or personal data is used.</li>
            <li>Database credentials are supplied only through environment variables and are never committed to the repository.</li>
            <li>The public repository is treated as externally visible; no confidential partnership terms or client-sensitive data are stored in it.</li>
            <li>Aggregate programme views do not expose business-level data unnecessarily.</li>
          </ul>
        </Prose>

        <Prose title="Decision accountability">
          <ul>
            <li>Circa supports human decisions; it does not make automated funding or policy decisions.</li>
            <li>Scores are prototype decision-support outputs and are labelled as such throughout the product.</li>
            <li>Every score is explainable down to its component weights and drivers.</li>
            <li>Material actions — assessment updates, score recalculations, scenario changes and demo resets — are recorded in the audit trail.</li>
          </ul>
        </Prose>

        <Prose title="Roles (architecture)">
          <p>
            Formal role-based access control is not enabled in this demonstrator, but the data model includes a users concept and
            the architecture is designed to add roles (SME leader, adviser, programme manager, analyst, investor) without rework.
          </p>
        </Prose>

        <Card>
          <CardHeader><CardTitle>Audit trail</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><Badge variant="outline">{e.action}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{e.entityType}</TableCell>
                    <TableCell className="text-muted-foreground">{e.actor}</TableCell>
                    <TableCell className="text-muted-foreground">{e.detail}</TableCell>
                    <TableCell className="whitespace-nowrap text-2xs text-muted-foreground">{formatDate(e.createdAt)}</TableCell>
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
