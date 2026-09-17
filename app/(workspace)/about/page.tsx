import { PageHead, Panel } from "@/components/ui/primitives";
export default function Page() {
  return (
    <div className="stack" style={{ maxWidth: 1050 }}>
      <PageHead
        eyebrow="CIRCA v0.1"
        title="Commercial intelligence for circular opportunities"
        description="Ambidexters × The DataKirk · CivTech Round 12 Product Demonstrator"
      />
      <Panel title="Challenge alignment">
        <div className="pad stack">
          <p>
            Circa explores Challenge 12.3, sponsored by Zero Waste Scotland. The
            application supports business assessment, financial scenario
            comparison, commercial resilience, investor readiness and aggregated
            programme insight.
          </p>
          <a
            className="text-link"
            href="https://www.civtech.scot/civtech-12-challenge-3-commercial-value-of-circular-economy-business-practices"
            target="_blank"
            rel="noreferrer"
          >
            Read the official CivTech challenge ↗
          </a>
          <p className="small muted">
            This demonstrator does not imply approval, sponsorship or
            endorsement by CivTech or Zero Waste Scotland.
          </p>
        </div>
      </Panel>
      <div className="grid2">
        <Panel title="Ambidexters">
          <div className="pad small muted">
            Product development, software engineering, data, analytics,
            implementation and quality assurance.
          </div>
        </Panel>
        <Panel title="The DataKirk">
          <div className="pad small muted">
            Scottish ecosystem insight, community engagement, inclusion, data
            literacy, user research and co-design.
          </div>
        </Panel>
      </div>
      <Panel title="Implemented and planned">
        <div className="pad">
          <ul className="list">
            <li>
              Implemented: database persistence, isolated demo workspaces,
              financial scenarios, explainable scores, assessment creation,
              investment case printing and audit records.
            </li>
            <li>
              Simulated: business records, evidence descriptions and commercial
              assumptions.
            </li>
            <li>
              Future integration: sponsor entry point, evidence sources and
              business systems.
            </li>
            <li>
              Future research and validation: model calibration, sector
              benchmarks, investor review, inclusion research and measured
              commercial outcomes.
            </li>
          </ul>
        </div>
      </Panel>
    </div>
  );
}
