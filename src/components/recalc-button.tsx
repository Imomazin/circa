"use client";

import * as React from "react";
import { RefreshCw, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalculateScoresAction } from "@/server/actions";

/** Recalculate-scores button used on the assessment view. */
export function RecalcButton({ assessmentId }: { assessmentId: string }) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function run() {
    setBusy(true);
    setDone(false);
    const res = await recalculateScoresAction({ assessmentId });
    setBusy(false);
    setDone(res.ok);
  }

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
      {done ? "Recalculated" : "Recalculate scores"}
    </Button>
  );
}
