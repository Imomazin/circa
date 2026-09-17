import { requireWorkspace } from "@/lib/services/session";
import { getAudit } from "@/lib/services/portfolio";
import { PageHead, Panel, Badge } from "@/components/ui/primitives";
export default async function Page() {
  const w = await requireWorkspace(),
    events = await getAudit(w.id);
  return (
    <div className="stack">
      <PageHead
        eyebrow="DATA & GOVERNANCE"
        title="Evidence, access and accountability"
        description="All business information is synthetic. Each presenter works in a separate database workspace."
      />
      <div className="grid3">
        <Panel title="Data provenance">
          <div className="pad">
            <Badge>Synthetic only</Badge>
            <p className="small muted" style={{ marginTop: 14 }}>
              Versioned scenario fixtures represent commercial patterns. No real
              company records, financial accounts or personal information are
              included.
            </p>
          </div>
        </Panel>
        <Panel title="Access model">
          <div className="pad">
            <Badge tone="grey">Presenter session</Badge>
            <p className="small muted" style={{ marginTop: 14 }}>
              A secure random session cookie restricts records and writes to
              your workspace. No enterprise identity, tenant administration or
              formal role hierarchy is implemented.
            </p>
          </div>
        </Panel>
        <Panel title="Retention concept">
          <div className="pad">
            <Badge tone="grey">30-day access expiry</Badge>
            <p className="small muted" style={{ marginTop: 14 }}>
              Session access expires after 30 days. Database cleanup is
              currently an operator task. Production retention and deletion
              policies require agreement.
            </p>
          </div>
        </Panel>
      </div>
      <Panel title="Data source register">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Confidence / limitation</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Synthetic business fixtures",
                  "Coherent demonstration cohort",
                  "Implemented",
                  "Fictional values; no external validation",
                ],
                [
                  "Presenter assumptions",
                  "Financial sensitivity and scoring",
                  "Implemented",
                  "Entered by the presenter",
                ],
                [
                  "Business Information Hub",
                  "Potential sponsor entry point",
                  "Future integration",
                  "No connection configured",
                ],
                [
                  "Independent benchmarks",
                  "Sector calibration and validation",
                  "Future research",
                  "No benchmark data loaded",
                ],
                [
                  "Evidence documents",
                  "Verify source assumptions",
                  "Future integration",
                  "Descriptions only; uploads unavailable",
                ],
              ].map((r) => (
                <tr key={r[0]}>
                  {r.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel
        title="Audit trail"
        subtitle="Most recent 100 events in this presenter workspace"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Recorded change</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td>
                    <strong>{e.action}</strong>
                  </td>
                  <td>{e.actor}</td>
                  <td className="muted">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="notice">
        The demonstration does not establish a lawful basis for real business or
        personal data. Production use requires agreed data roles, governance
        review and appropriate organisational controls.
      </div>
    </div>
  );
}
