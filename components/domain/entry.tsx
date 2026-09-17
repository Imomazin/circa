"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
export function Entry() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  async function start() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      router.push(d.redirect);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to open the demonstration.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="entry">
      <section className="entry-story">
        <div className="brand">
          <span className="brand-mark">c</span>circa
        </div>
        <p className="eyebrow" style={{ marginTop: 70 }}>
          CIRCULAR ECONOMY · COMMERCIAL INTELLIGENCE
        </p>
        <h1 style={{ marginTop: 20 }}>
          A clearer view of commercial potential.
        </h1>
        <p>
          Assess a circular opportunity. Test its financial assumptions. Build
          an investment case with the evidence behind every decision.
        </p>
        <div className="entry-preview">
          <div>
            <strong>12</strong>
            <small>Business scenarios</small>
          </div>
          <div>
            <strong>10</strong>
            <small>Scottish sectors</small>
          </div>
          <div>
            <strong>5</strong>
            <small>Decision-support scores</small>
          </div>
        </div>
        <div className="entry-footer">
          Ambidexters × The DataKirk
          <br />
          <span className="small">
            CivTech Round 12 Product Demonstrator · Challenge 12.3
          </span>
        </div>
      </section>
      <section className="entry-content">
        <div>
          <span className="badge grey">CIRCA DEMONSTRATOR v0.1</span>
          <h2>Open your workspace</h2>
          <p className="muted">
            Explore a portfolio of fictional Scottish businesses. Your scenario
            changes are saved in your own demonstration workspace.
          </p>
          <div style={{ marginTop: 27 }} className="stack">
            {[
              "A complete assessment and investment workflow",
              "Financial scenarios with real persistence",
              "Transparent commercial scoring and evidence",
            ].map((s) => (
              <div key={s} className="flex small">
                <Check size={16} />
                {s}
              </div>
            ))}
          </div>
          <button className="btn primary" onClick={start} disabled={busy}>
            {busy ? "Preparing your portfolio…" : "Open demonstration"}
            <ArrowRight size={16} />
          </button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="notice">
            <ShieldCheck size={19} style={{ flexShrink: 0 }} />
            <span>
              Synthetic data only. Prototype scores support human judgement. No
              external systems or paid AI services are connected.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
