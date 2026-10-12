import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, SlidersHorizontal, FileText, ClipboardCheck, Building2 } from "lucide-react";
import { PageHeader, DetailRow, SectionTitle, KeyValue, DisclaimerBanner } from "@/components/primitives";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ScoreStrip } from "@/components/dimension-card";
import { ScoreBadge } from "@/components/score";
import { OrgNetworkPanel } from "@/components/network/org-network";
import { getOrgProfile } from "@/server/network";
import { getBusinessDetail } from "@/server/queries";
import { formatGBPCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = getOrgProfile(id);
  return { title: profile?.org.name ?? "Organisation" };
}

export default async function OrgProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = getOrgProfile(id);
  if (!profile) notFound();
  const { org } = profile;
  const detail = org.featured ? await getBusinessDetail(id) : null;

  return (
    <div>
      <PageHeader
        eyebrow={`${org.sector} · ${org.region}`}
        title={org.name}
        description={detail?.assessment.opportunitySummary ?? `Verified organisation in the Scottish circular network. ${org.size}, incorporated ${org.incorporated}.`}
        actions={
          detail ? (
            <>
              <Link href={`/assessments/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <ClipboardCheck className="h-4 w-4" /> Edit assessment
              </Link>
              <Link href={`/scenarios/${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <SlidersHorizontal className="h-4 w-4" /> Scenarios
              </Link>
              <Link href={`/investor-readiness/${id}/case`} className={buttonVariants({ size: "sm" })}>
                <FileText className="h-4 w-4" /> Investment case
              </Link>
            </>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {org.verified && (
          <Badge variant="evergreen">
            <BadgeCheck className="h-3 w-3" /> Verified · Companies House
          </Badge>
        )}
        <Badge variant="outline">{org.companyNumber}</Badge>
        <Badge variant="outline">{org.status}</Badge>
        <Badge variant="outline">{org.size}</Badge>
        {detail && (
          <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            Headline <ScoreBadge score={detail.score.headline} />
          </span>
        )}
      </div>

      {detail && (
        <div className="mb-6">
          <ScoreStrip
            scores={[
              { label: "Commercial Viability", value: detail.bundle.viability.score },
              { label: "Commercial Resilience", value: detail.bundle.resilience.score },
              { label: "Investor Readiness", value: detail.bundle.investor.score },
              { label: "Circular Opportunity", value: detail.bundle.opportunity.score },
              { label: "Evidence Confidence", value: detail.bundle.evidence.score },
            ]}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-evergreen-600" /> Verified identity
              </CardTitle>
              <CardDescription>Enriched via the Companies House connector</CardDescription>
            </CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Company number">{org.companyNumber}</DetailRow>
                <DetailRow label="Status">{org.status}</DetailRow>
                <DetailRow label="SIC codes">{org.sic.join(", ")}</DetailRow>
                <DetailRow label="Registered office">{org.region}, Scotland</DetailRow>
                <DetailRow label="Incorporated">{org.incorporated}</DetailRow>
                <DetailRow label="Sector">{org.sector}</DetailRow>
                {detail && <DetailRow label="Operating model">{detail.org.currentOperatingModel}</DetailRow>}
              </dl>
            </CardContent>
          </Card>

          {detail && (
            <Card>
              <CardHeader>
                <CardTitle>Circular opportunity</CardTitle>
                <CardDescription>{detail.assessment.opportunitySummary}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{detail.assessment.commercialRationale}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {detail.assessment.circularModels.map((m) => (
                    <Badge key={m} variant="evergreen">{m}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <SectionTitle hint="Material flows this organisation can supply or absorb">Circular network position</SectionTitle>
            <OrgNetworkPanel orgId={org.id} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Procurement profile</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4 p-5 pt-0">
              <KeyValue label="Annual spend" value={formatGBPCompact(org.procurementSpend)} />
              <div>
                <p className="mb-1.5 text-2xs uppercase tracking-[0.1em] text-muted-foreground">Top categories</p>
                <div className="flex flex-wrap gap-1">
                  {org.procurementCategories.map((c) => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>
              </div>
              <p className="text-2xs text-muted-foreground">Demand signals sourced from the procurement connectors.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Relationship</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 p-5 pt-0">
              <KeyValue label="Opportunities" value={String(profile.network.matches.length)} mono={false} />
              <KeyValue label="Network value" value={formatGBPCompact(profile.network.networkValue)} />
              {!detail && (
                <p className="text-2xs text-muted-foreground">
                  This organisation is verified and mapped by material position. A full commercial
                  assessment is available for the featured cohort.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
