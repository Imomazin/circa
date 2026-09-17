"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
export function DemoControls() {
  const ref = useRef<HTMLDialogElement>(null),
    [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  const router = useRouter();
  async function reset() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/demo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      ref.current?.close();
      setConfirmation("");
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="flex between" style={{ flexWrap: "wrap" }}>
        <div>
          <h3>Restore the starting scenarios</h3>
          <p className="small muted">
            Reset removes changes in your presenter workspace. Other workspaces
            are unaffected.
          </p>
          {done && (
            <p className="success" role="status">
              Starting scenarios restored.
            </p>
          )}
        </div>
        <button
          className="btn"
          onClick={() => {
            setDone(false);
            ref.current?.showModal();
          }}
        >
          <RotateCcw size={14} />
          Reset demonstration
        </button>
      </div>
      <dialog className="dialog" ref={ref} aria-labelledby="reset-title">
        <div className="panel-head">
          <h2 id="reset-title">Reset your demonstration?</h2>
          <button
            aria-label="Close reset dialog"
            className="close"
            onClick={() => ref.current?.close()}
          >
            ×
          </button>
        </div>
        <div className="dialog-body stack">
          <p className="small muted">
            Your new assessments and scenario changes will be replaced by the 12
            starting scenarios. The reset is recorded in your audit trail.
          </p>
          <label className="field">
            <span>Type RESET to confirm</span>
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="flex">
            <button className="btn" onClick={() => ref.current?.close()}>
              Cancel
            </button>
            <button
              className="btn danger"
              disabled={confirmation !== "RESET" || busy}
              onClick={reset}
            >
              {busy ? "Restoring…" : "Confirm reset"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
