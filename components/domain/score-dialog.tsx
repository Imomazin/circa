"use client";
import { useRef, useEffect } from "react";
import type { ScoreFamily } from "@/lib/scoring/commercial";
export function ScoreDialog({
  score,
  date,
  onClose,
}: {
  score: ScoreFamily | null;
  date: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (score) ref.current?.showModal();
    else ref.current?.close();
  }, [score]);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="score-title"
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">PROTOTYPE DECISION-SUPPORT SCORE</p>
          <h2 id="score-title" style={{ marginTop: 8 }}>
            {score?.label} · {score?.score}/100
          </h2>
          <p className="small muted">
            {score?.band} · {score?.confidence} evidence confidence
          </p>
        </div>
        <button
          className="close"
          aria-label="Close score explanation"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {score && (
        <div className="dialog-body">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Score</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {score.components.map((c) => (
                <tr key={c.label}>
                  <td>
                    <strong>{c.label}</strong>
                    <p className="small muted">{c.explanation}</p>
                  </td>
                  <td>{c.score}</td>
                  <td>{Math.round(c.weight * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid2" style={{ marginTop: 20 }}>
            <div>
              <h3>Strongest drivers</h3>
              <ul className="list">
                {score.positive.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <h3>Priority improvements</h3>
              <ul className="list">
                {(score.actions.length
                  ? score.actions
                  : [
                      "Validate the leading assumptions with independent evidence.",
                    ]
                ).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Missing evidence</h3>
              <ul className="list">
                {(score.missing.length
                  ? score.missing
                  : [
                      "No rule-identified gaps; external validation remains necessary.",
                    ]
                ).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="small muted">
                Recalculated {date}
                <br />
                Methodology v0.1 · Not externally validated
              </p>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
