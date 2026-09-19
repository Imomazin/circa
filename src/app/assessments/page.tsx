import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllBusinessSummaries } from "@/server/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Assessments" };
export const dynamic = "force-dynamic";

const stageVariant = (s: string): React.ComponentProps<typeof Badge>["variant"] =>
  s === "Investment Ready" ? "strong" : s === "Validated" ? "evergreen" : s === "In Review" ? "amber" : "outline";

export default async function AssessmentsPage() {
  const summaries = await getAllBusinessSummaries();
  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Assessments"
        description="Each business has a structured circular-opportunity assessment feeding the commercial scoring engine. Open one to review its sections or edit the inputs."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Circular model</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Headline</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map(({ org, assessment, score }) => (
                <TableRow key={assessment.id}>
                  <TableCell>
                    <Link href={`/assessments/${assessment.id}`} className="font-medium text-foreground hover:text-evergreen-600 hover:underline">
                      {org.name}
                    </Link>
                    <p className="text-2xs text-muted-foreground">{org.sector}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {assessment.circularModels.map((m) => (
                        <Badge key={m} variant="outline">{m}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={stageVariant(assessment.stage)}>{assessment.stage}</Badge></TableCell>
                  <TableCell className="text-right"><ScoreBadge score={score.headline} /></TableCell>
                  <TableCell className="whitespace-nowrap text-2xs text-muted-foreground">{formatDate(assessment.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/assessments/${assessment.id}/edit`} className="text-xs font-medium text-evergreen-600 hover:underline">
                      Edit →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
