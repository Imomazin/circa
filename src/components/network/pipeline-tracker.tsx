"use client";

import * as React from "react";
import { Check, ChevronRight, ChevronLeft, UserCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PIPELINE_STAGES, type PipelineStage } from "@/domain/network/types";

const OWNERS = ["Unassigned", "A. Fraser", "R. Mensah", "K. Lin", "S. Doyle", "J. Okafor", "M. Reid"];

interface Activity {
  at: number;
  text: string;
}
interface Persisted {
  stageIndex: number;
  owner: string;
  activity: Activity[];
}

function keyFor(id: string) {
  return `circa:match:${id}`;
}

/**
 * Opportunity workflow. The initial stage and owner come from the network
 * engine; a user can progress the opportunity, reassign ownership and record
 * activity. State persists per-browser via localStorage so the workflow is
 * demonstrable without a database — it re-bases cleanly if the match changes.
 */
export function PipelineTracker({
  matchId,
  initialStage,
  initialOwner,
}: {
  matchId: string;
  initialStage: PipelineStage;
  initialOwner: string;
}) {
  const baseIndex = Math.max(0, PIPELINE_STAGES.indexOf(initialStage));
  const [state, setState] = React.useState<Persisted>({
    stageIndex: baseIndex,
    owner: initialOwner,
    activity: [],
  });
  const [note, setNote] = React.useState("");
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(matchId));
      if (raw) setState(JSON.parse(raw) as Persisted);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [matchId]);

  const persist = React.useCallback(
    (next: Persisted) => {
      setState(next);
      try {
        localStorage.setItem(keyFor(matchId), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [matchId],
  );

  function move(delta: number) {
    const nextIndex = Math.max(0, Math.min(PIPELINE_STAGES.length - 1, state.stageIndex + delta));
    if (nextIndex === state.stageIndex) return;
    persist({
      ...state,
      stageIndex: nextIndex,
      activity: [
        { at: Date.now(), text: `Stage ${delta > 0 ? "advanced" : "moved back"} to ${PIPELINE_STAGES[nextIndex]}` },
        ...state.activity,
      ],
    });
  }

  function setOwner(owner: string) {
    persist({
      ...state,
      owner,
      activity: [
        { at: Date.now(), text: owner === "Unassigned" ? "Ownership cleared" : `Assigned to ${owner}` },
        ...state.activity,
      ],
    });
  }

  function addNote() {
    const text = note.trim();
    if (!text) return;
    persist({ ...state, activity: [{ at: Date.now(), text }, ...state.activity] });
    setNote("");
  }

  const current = state.stageIndex;

  return (
    <div className="flex flex-col gap-5">
      {/* Stepper */}
      <ol className="flex flex-wrap gap-1.5">
        {PIPELINE_STAGES.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={stage}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-2xs ${
                active
                  ? "border-transparent bg-evergreen-700 font-medium text-white"
                  : done
                    ? "border-transparent bg-evergreen-100 text-evergreen-800 dark:bg-evergreen-800/40 dark:text-evergreen-100"
                    : "border-border text-muted-foreground"
              }`}
            >
              {done ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-stone-400"}`} />
              )}
              {stage}
            </li>
          );
        })}
      </ol>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => move(-1)} disabled={current === 0}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button size="sm" onClick={() => move(1)} disabled={current === PIPELINE_STAGES.length - 1}>
          Advance stage <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <UserCircle2 className="h-4 w-4 text-muted-foreground" />
          <select
            aria-label="Owner"
            value={state.owner}
            onChange={(e) => setOwner(e.target.value)}
            className="h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {OWNERS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="Record activity — a call, a quote, a decision…"
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" variant="secondary" onClick={addNote} disabled={!note.trim()}>
            <Send className="h-3.5 w-3.5" /> Log
          </Button>
        </div>
        {hydrated && state.activity.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {state.activity.slice(0, 6).map((a, i) => (
              <li key={i} className="flex items-start justify-between gap-3 px-3 py-2">
                <span className="text-xs text-foreground">{a.text}</span>
                <span className="shrink-0 text-2xs text-muted-foreground">
                  {new Date(a.at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-2xs text-muted-foreground">
            No activity recorded yet. Advancing the stage, assigning an owner or logging a note will
            appear here (saved in this browser for the demonstration).
          </p>
        )}
      </div>
    </div>
  );
}
