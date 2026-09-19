import type { Metadata } from "next";
import { PageHeader, DisclaimerBanner } from "@/components/primitives";
import { Prose } from "@/components/prose";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="About"
        title="About Circa"
        description="Commercial decision intelligence for circular economy opportunities."
      />
      <div className="mb-6"><DisclaimerBanner /></div>

      <div className="flex flex-col gap-6">
        <Prose title="Purpose">
          <p>
            Circa exists to answer one question: <strong>does this circular business opportunity make commercial sense?</strong>
            It helps organisations understand commercial viability, resilience, capital requirements, risk, resource and
            supply-chain dependency, customer and recurring-revenue economics, investment readiness, evidence quality and
            implementation readiness. Environmental information supports the analysis, but commercial value is the focus.
          </p>
        </Prose>

        <Prose title="CivTech challenge">
          <p>
            Circa is a demonstrator built in response to <strong>CivTech 12.3</strong>, sponsored by Zero Waste Scotland:
            <em> &ldquo;How can technology demonstrate the commercial value of circular economy business practices?&rdquo;</em>
          </p>
        </Prose>

        <Prose title="Partnership">
          <p>
            <strong>Ambidexters Ltd</strong> leads technology, software engineering, AI, analytics, product and implementation.
            <strong> The DataKirk SCIO</strong> contributes Scottish ecosystem knowledge, stakeholder insight, inclusion,
            community engagement, user research, data literacy and co-design.
          </p>
        </Prose>

        <Prose title="How it is built">
          <ul>
            <li>Next.js (App Router) and TypeScript, with server components and server actions.</li>
            <li>PostgreSQL on Neon, accessed server-side through Drizzle ORM.</li>
            <li>A modular, deterministic commercial scoring engine kept separate from the interface.</li>
            <li>Tailwind CSS and Recharts for a restrained, executive-grade presentation.</li>
            <li>No external LLM is required — the core demonstration is fully deterministic.</li>
          </ul>
        </Prose>

        <Prose title="Status & disclaimer">
          <ul>
            <li>Circa is a <strong>product demonstrator</strong>, not a production system.</li>
            <li>All demonstration data is <strong>synthetic</strong>.</li>
            <li>Scores and recommendations are <strong>prototype decision-support outputs</strong>.</li>
            <li>Nothing here implies Zero Waste Scotland or CivTech endorsement, approval or deployment.</li>
          </ul>
        </Prose>
      </div>
    </div>
  );
}
